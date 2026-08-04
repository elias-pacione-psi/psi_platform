import 'server-only'
import crypto from 'node:crypto'
import { baseUrl } from '@/utils/site-url'

// Wrapper de la API REST de Mercado Pago (Checkout Pro) hecho a mano, sin el SDK
// oficial: Checkout Pro son dos llamadas HTTP (crear preferencia, consultar un pago) más
// la verificación de firma del webhook — el SDK trae de más para lo que hace falta acá.
//
// SIN VERIFICAR CONTRA LA API REAL. No hay credenciales de Mercado Pago en este entorno
// (ver docs/plan-modelo-comercial.md, fase 4 — "sigue pendiente" desde que se escribió
// el plan). El contrato está implementado según la documentación oficial de Checkout Pro
// y de webhooks (manifest de firma, verificación server-side del pago antes de confiar
// en el webhook), pero ninguna de estas funciones corrió contra un pago de verdad
// todavía. Antes de la primera venta real: probar contra el ambiente de sandbox de
// Mercado Pago con credenciales de test, confirmar el flujo completo (preferencia →
// checkout → webhook → descarga) y recién después pasar a credenciales de producción.

const API_BASE = 'https://api.mercadopago.com'

export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN)
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
        back_urls: {
          success: `${url}/pedido/${input.ordenId}`,
          pending: `${url}/pedido/${input.ordenId}`,
          failure: `${url}/pedido/${input.ordenId}`,
        },
        auto_return: 'approved',
        notification_url: `${url}/api/webhooks/mercadopago`,
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
}

// Nunca se confía en el body que trae el webhook para saber si un pago se aprobó: se
// vuelve a pedir el recurso a la API de Mercado Pago con el id que trajo la notificación,
// y ESE status es la verdad. Mismo principio que ya rige en el resto de la app — un dato
// que manda el cliente (o, acá, cualquiera que sepa la URL del webhook) nunca se toma
// como definitivo sin volver a confirmarlo server-side.
export async function obtenerPagoMP(paymentId: string): Promise<PagoMP | null> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) return null

  try {
    const res = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      id: String(data.id),
      status: String(data.status),
      externalReference: typeof data.external_reference === 'string' ? data.external_reference : null,
    }
  } catch (err) {
    console.error('Error consultando el pago en Mercado Pago:', err)
    return null
  }
}

// Verificación de firma del webhook según el esquema documentado por Mercado Pago: el
// header `x-signature` trae "ts=<timestamp>,v1=<hmac>", y el HMAC-SHA256 (con
// MERCADOPAGO_WEBHOOK_SECRET, que se obtiene del panel de la integración) se calcula
// sobre el manifest "id:<dataId>;request-id:<x-request-id>;ts:<ts>;". Sin esto, cualquiera
// que supiera la URL del webhook podría mandar un POST fingiendo un pago aprobado y
// regalarse el ebook — por eso esta verificación tiene que pasar ANTES de tocar la orden.
export function verificarFirmaWebhookMP(params: {
  xSignature: string | null
  xRequestId: string | null
  dataId: string | null
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret || !params.xSignature || !params.xRequestId || !params.dataId) return false

  const partes: Record<string, string> = {}
  for (const parte of params.xSignature.split(',')) {
    const [k, v] = parte.split('=').map((s) => s.trim())
    if (k && v) partes[k] = v
  }
  const { ts, v1 } = partes
  if (!ts || !v1) return false

  const manifest = `id:${params.dataId};request-id:${params.xRequestId};ts:${ts};`
  const esperado = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  // Comparación en tiempo constante: con `===` la duración de la comparación byte a byte
  // depende de en qué posición difieren, y eso es una fuga (timing attack) que dejaría
  // reconstruir la firma correcta probando de a un caracter.
  const bufEsperado = Buffer.from(esperado, 'hex')
  const bufRecibido = Buffer.from(v1, 'hex')
  if (bufEsperado.length !== bufRecibido.length) return false
  return crypto.timingSafeEqual(bufEsperado, bufRecibido)
}
