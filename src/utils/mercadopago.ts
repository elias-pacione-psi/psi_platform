import 'server-only'
import crypto from 'node:crypto'
import { baseUrl } from '@/utils/site-url'

// Wrapper de la API REST de Mercado Pago (Checkout Pro) hecho a mano, sin el SDK
// oficial: Checkout Pro son dos llamadas HTTP (crear preferencia, consultar un pago) más
// la verificación de firma del webhook — el SDK trae de más para lo que hace falta acá.
//
// El contrato está implementado siguiendo la documentación y los SDKs oficiales de
// Mercado Pago (github.com/mercadopago). Donde el SDK de Node y el de Python se
// contradicen —el caso del `ts` de la firma, ver verificarFirmaWebhookMP— se resolvió
// aceptando las dos formas en vez de apostar a una.

const API_BASE = 'https://api.mercadopago.com'

export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN)
}

// Mercado Pago RECHAZA la preferencia entera si `auto_return` viene con un back_url que
// apunta a localhost (checklist oficial de Checkout Pro: "MP rejects auto_return:
// 'approved' when back_urls.success is a localhost URL"). Con NEXT_PUBLIC_SITE_URL en
// http://localhost:3000 —que es lo normal en dev— mandar auto_return hacía fallar la
// creación de la preferencia y la compra ni siquiera arrancaba. Mismo criterio para
// notification_url: un webhook a localhost no es alcanzable desde los servidores de
// Mercado Pago, así que se omite en vez de registrarlo y esperar notificaciones que
// nunca van a llegar.
function esUrlPublica(url: string): boolean {
  return /^https:\/\//i.test(url) && !/^https:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::|\/|$)/i.test(url)
}

type PreferenciaInput = {
  ordenId: string
  titulo: string
  precioArs: number
  email: string
}

export async function crearPreferenciaMP(
  input: PreferenciaInput,
): Promise<{ initPoint: string } | { error: string }> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return { error: 'Mercado Pago no está configurado' }

  const url = baseUrl()
  const publica = esUrlPublica(url)

  try {
    const res = await fetch(`${API_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        // Evita que un reintento de red (fetch se corta, el cliente reintenta) le cree
        // una segunda preferencia a Mercado Pago para la misma orden.
        'X-Idempotency-Key': input.ordenId,
      },
      body: JSON.stringify({
        items: [{
          title: input.titulo,
          quantity: 1,
          unit_price: input.precioArs,
          currency_id: 'ARS',
        }],
        payer: { email: input.email },
        external_reference: input.ordenId,
        // Los tres back_urls apuntan a la misma página: /pedido/[id] ya sabe leer el
        // estado real de la orden (nunca confía en cuál de los tres trajo de vuelta a
        // la persona) y mostrar lo que corresponda — pagado, pendiente o rechazado.
        // Mercado Pago le agrega ?payment_id=&status=&external_reference=… al volver, y
        // la página los usa para confirmar el pago contra la API sin depender de que el
        // webhook haya llegado primero (ver conciliarPagoDeOrden).
        back_urls: {
          success: `${url}/pedido/${input.ordenId}`,
          pending: `${url}/pedido/${input.ordenId}`,
          failure: `${url}/pedido/${input.ordenId}`,
        },
        ...(publica
          ? {
            auto_return: 'approved',
            notification_url: `${url}/api/webhooks/mercadopago`,
          }
          : {}),
      }),
    })

    if (!res.ok) {
      const detalle = await res.text().catch(() => '')
      console.error('Mercado Pago rechazó la preferencia:', res.status, detalle)
      return { error: 'No se pudo iniciar el pago. Intentá de nuevo en un momento.' }
    }

    const data = await res.json()
    if (typeof data.init_point !== 'string') {
      console.error('Mercado Pago no devolvió init_point:', data)
      return { error: 'No se pudo iniciar el pago. Intentá de nuevo en un momento.' }
    }
    return { initPoint: data.init_point }
  } catch (err) {
    console.error('Error llamando a Mercado Pago:', err)
    return { error: 'No se pudo conectar con Mercado Pago. Intentá de nuevo.' }
  }
}

export type PagoMP = {
  id: string
  status: string // 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | ...
  externalReference: string | null
  // Para el camino del link de pago manual, que no lleva external_reference: son lo
  // único con lo que se puede reconocer a qué orden pendiente corresponde el pago.
  emailPagador: string | null
  montoCentavos: number | null
}

// Nunca se confía en el body que trae el webhook (ni en el query string del back_url)
// para saber si un pago se aprobó: se vuelve a pedir el recurso a la API de Mercado Pago
// con el id, y ESE status es la verdad. Es la regla que la propia guía de Checkout Pro
// pone como obligatoria ("Never trust query params alone — always verify server-side") y
// el mismo principio que ya rige en el resto de la app.
export async function obtenerPagoMP(paymentId: string): Promise<PagoMP | null> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    const monto = Number(data.transaction_amount)
    return {
      id: String(data.id),
      status: String(data.status),
      externalReference: typeof data.external_reference === 'string' ? data.external_reference : null,
      emailPagador: typeof data.payer?.email === 'string' ? data.payer.email.trim().toLowerCase() : null,
      montoCentavos: Number.isFinite(monto) ? Math.round(monto * 100) : null,
    }
  } catch (err) {
    console.error('Error consultando el pago en Mercado Pago:', err)
    return null
  }
}

// Checkout Pro no notifica solo con topic 'payment': también manda 'merchant_order', y
// ahí el data.id NO es un id de pago (pedirlo como /v1/payments/{id} da 404 y la
// notificación se perdía en silencio). La merchant order es la que lista los pagos que
// se le hicieron a la preferencia; de ahí salen los ids reales.
export async function obtenerPagosDeMerchantOrderMP(merchantOrderId: string): Promise<string[]> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return []

  try {
    const res = await fetch(`${API_BASE}/merchant_orders/${encodeURIComponent(merchantOrderId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data.payments)) return []
    return data.payments
      .map((p: { id?: unknown }) => (p?.id === undefined || p?.id === null ? null : String(p.id)))
      .filter((id: string | null): id is string => Boolean(id))
  } catch (err) {
    console.error('Error consultando la merchant order en Mercado Pago:', err)
    return []
  }
}

// Verificación de firma del webhook según el esquema documentado por Mercado Pago: el
// header `x-signature` trae "ts=<timestamp>,v1=<hmac>", y el HMAC-SHA256 (con
// MERCADOPAGO_WEBHOOK_SECRET, que se obtiene del panel de la integración) se calcula
// sobre el manifest "id:<dataId>;request-id:<x-request-id>;ts:<ts>;". Sin esto, cualquiera
// que supiera la URL del webhook podría mandar un POST fingiendo un pago aprobado y
// regalarse el ebook — por eso esta verificación tiene que pasar ANTES de tocar la orden.
const VENTANA_FIRMA_MS = 5 * 60 * 1000

// EL BUG que rompía toda la venta automática (2026-09-05): esto hacía `Number(ts) * 1000`
// asumiendo que el ts venía en segundos. Mercado Pago lo manda en MILISEGUNDOS
// (docs: `ts=1742505638683`; sdk-python: "Expected format: ts=<ms>", que compara contra
// time.time() * 1000). Multiplicar milisegundos por mil da una fecha ~1000 años en el
// futuro, así que la ventana de frescura no se cumplía NUNCA: el webhook respondía 401 a
// todas las notificaciones, la orden nunca pasaba a 'pagada' y la descarga nunca se
// habilitaba. El sdk-nodejs oficial tiene todavía hoy la misma multiplicación por 1000
// (src/utils/webhook/index.ts) mientras su propio test usa un ts de 13 dígitos — por eso
// acá no se le cree a ninguno de los dos y se decide por magnitud: un epoch en segundos
// no llega a 1e11 hasta el año 5138, y uno en milisegundos ya lo pasó en 1973.
function tsAMilisegundos(ts: string): number | null {
  if (!/^\d+$/.test(ts)) return null
  const n = Number(ts)
  if (!Number.isFinite(n) || n <= 0) return null
  return n < 1e11 ? n * 1000 : n
}

function hmacHex(secret: string, manifest: string): string {
  return crypto.createHmac('sha256', secret).update(manifest).digest('hex')
}

// Comparación en tiempo constante: con `===` la duración de la comparación byte a byte
// depende de en qué posición difieren, y eso es una fuga (timing attack) que dejaría
// reconstruir la firma correcta probando de a un caracter.
function igualEnTiempoConstante(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function verificarFirmaWebhookMP(params: {
  xSignature: string | null
  xRequestId: string | null
  // Los dos lugares de donde Mercado Pago manda el id: la doc arma el manifest con el
  // `data.id` del QUERY STRING y el skill oficial lo toma del body. Llegan los dos y
  // normalmente coinciden, pero el que hay que usar es aquel con el que Mercado Pago
  // firmó — así que se prueban ambos en vez de adivinar (es la causa más reportada de
  // "la firma valida en test y falla en producción").
  dataIdQuery: string | null
  dataIdBody?: string | null
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error(
      'MERCADOPAGO_WEBHOOK_SECRET no está configurada: el webhook rechaza TODA notificación. ' +
      'Sacarla del panel de Mercado Pago (Tus integraciones → Webhooks → Clave secreta).',
    )
    return false
  }
  if (!params.xSignature || !params.xRequestId) return false

  // `indexOf('=')` y no `split('=')`: el hash es hex y hoy no trae '=', pero partir por
  // todas las ocurrencias descarta silenciosamente cualquier valor que sí lo tenga (es
  // como lo parsea el SDK oficial).
  let ts: string | undefined
  let v1: string | undefined
  for (const parte of params.xSignature.split(',')) {
    const i = parte.indexOf('=')
    if (i === -1) continue
    const clave = parte.slice(0, i).trim().toLowerCase()
    const valor = parte.slice(i + 1).trim()
    if (!clave || !valor) continue
    if (clave === 'ts') ts = valor
    else if (clave === 'v1') v1 = valor
  }
  if (!ts || !v1) return false

  // Ventana de frescura: sin esto, una notificación firmada capturada alguna vez sigue
  // siendo válida para siempre y se puede reenviar. El impacto está acotado porque el
  // estado se re-consulta a la API de Mercado Pago igual, pero una firma sin vencimiento
  // no es una firma completa.
  const tsMs = tsAMilisegundos(ts)
  if (tsMs === null) return false
  if (Math.abs(Date.now() - tsMs) > VENTANA_FIRMA_MS) {
    console.error('Webhook de Mercado Pago fuera de la ventana de frescura — ts:', ts)
    return false
  }

  // La doc pide pasar el data.id a minúsculas si viene alfanumérico en mayúsculas, pero
  // el SDK de Node lo deja tal cual y el de Go lo baja siempre. Se prueban las variantes
  // que existan: son cuatro comparaciones de hash como mucho, y cubren las tres
  // convenciones sin depender de cuál esté aplicando Mercado Pago hoy.
  const candidatos = new Set<string>()
  for (const crudo of [params.dataIdQuery, params.dataIdBody]) {
    if (!crudo) continue
    candidatos.add(crudo)
    candidatos.add(crudo.toLowerCase())
  }
  // Sin ningún data.id el manifest omite el par `id:` (así lo arma el SDK oficial).
  if (candidatos.size === 0) candidatos.add('')

  for (const dataId of candidatos) {
    const manifest = dataId
      ? `id:${dataId};request-id:${params.xRequestId};ts:${ts};`
      : `request-id:${params.xRequestId};ts:${ts};`
    if (igualEnTiempoConstante(hmacHex(secret, manifest), v1)) return true
  }

  return false
}
