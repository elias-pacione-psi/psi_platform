'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { crearPreferenciaMP, mercadoPagoConfigurado } from '@/utils/mercadopago'
import { firmarDescargaR2 } from '@/utils/r2'
import { keyDeMarcadorR2 } from '@/utils/r2-marcador'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizarEmail(emailCrudo: string): string | null {
  const email = (emailCrudo ?? '').trim().toLowerCase()
  if (!email || email.length > 254 || !RE_EMAIL.test(email)) return null
  return email
}

// Toda compra —automática o por link manual— nace acá. Que la orden exista ANTES de
// mandar a nadie a pagar no es un detalle de implementación: es lo único que después
// permite reconocer el pago, mostrar /pedido/[id] y entregar el PDF. El bug del
// 2026-08-28 (Lucas pagó "Vuelvo" y no recibió nada) fue exactamente esto — el camino
// del link manual saltaba este paso, así que la plata entraba a Mercado Pago y del lado
// de la plataforma no quedaba registro de que existiera una compra.
async function crearOrdenPendiente(
  ebook: { id: string; precio_centavos: number },
  email: string,
  proveedor: 'mercadopago' | 'manual',
) {
  // Con service-role: quien compra no tiene sesión (la cuenta, si la crea, es posterior
  // y opcional — fase 5), así que no hay auth.uid() con el que la policy de `ordenes`
  // pudiera dejar pasar el insert por RLS normal.
  const supabaseAdmin = createAdminClient()
  const { data: orden, error } = await supabaseAdmin
    .from('ordenes')
    .insert({
      ebook_id: ebook.id,
      email_comprador: email,
      precio_cobrado: ebook.precio_centavos,
      moneda: 'ARS',
      estado: 'pendiente',
      proveedor,
    })
    .select('id')
    .single()

  if (error || !orden) {
    console.error('No se pudo crear la orden:', error?.message)
    return null
  }
  return orden
}

const LIMITE_COMPRAS_PENDIENTES_POR_HORA = 3

// Sin esto, cualquiera sin sesión puede llamar iniciarCompraEbook/Manual en loop: cada
// vuelta inserta una orden 'pendiente' con service-role y, en el camino automático, gasta
// cuota real de la API de Mercado Pago. Mismo criterio que el tope de crearSolicitud en
// app/actions.ts, pero solo por email —un tope global acá penalizaría un pico real de
// ventas, no abuso— y mirando 'pendiente': una vez pagada o fallida deja de contar.
async function demasiadasComprasPendientes(email: string): Promise<boolean> {
  const supabaseAdmin = createAdminClient()
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('ordenes')
    .select('*', { count: 'exact', head: true })
    .eq('email_comprador', email)
    .eq('estado', 'pendiente')
    .gte('created_at', desde)
  return (count ?? 0) >= LIMITE_COMPRAS_PENDIENTES_POR_HORA
}

// Endpoint público (lo llama cualquiera desde /ebooks/[slug], sin sesión): valida y
// acota todo, igual que crearSolicitud en app/actions.ts.
export async function iniciarCompraEbook(ebookId: string, emailCrudo: string) {
  const email = normalizarEmail(emailCrudo)
  if (!email) return { error: 'Ingresá un email válido' }

  if (await demasiadasComprasPendientes(email)) {
    return { error: 'Ya tenés una compra en curso con ese email. Terminala o esperá un rato.' }
  }

  if (!mercadoPagoConfigurado()) {
    return { error: 'Todavía no está disponible el pago online para este ebook.' }
  }

  const supabase = await createClient()
  const { data: ebook } = await supabase
    .from('ebooks')
    .select('id, titulo, precio_centavos')
    .eq('id', ebookId)
    .eq('estado', 'publicado')
    .maybeSingle()
  if (!ebook) return { error: 'Ese ebook ya no está disponible.' }

  const orden = await crearOrdenPendiente(ebook, email, 'mercadopago')
  if (!orden) return { error: 'No se pudo iniciar la compra. Intentá de nuevo.' }

  const preferencia = await crearPreferenciaMP({
    ordenId: orden.id,
    titulo: ebook.titulo,
    precioArs: ebook.precio_centavos / 100,
    email,
  })

  if ('error' in preferencia) {
    // La orden queda registrada (para no perder el intento) pero marcada como lo que
    // fue: nunca llegó a tener un checkout real donde alguien pudiera pagar.
    const supabaseAdmin = createAdminClient()
    await supabaseAdmin.from('ordenes').update({ estado: 'fallida' }).eq('id', orden.id)
    return { error: preferencia.error }
  }

  return { url: preferencia.initPoint }
}

// Compra por link de pago manual (ebooks.link_pago: un mpago.la / link de Ualá cargado a
// mano en el admin). El link es una URL estática del proveedor: no acepta
// external_reference, no acepta back_urls y no dispara el webhook, así que del pago NO
// vuelve absolutamente nada — ni redirect al sitio ni notificación. Eso no se puede
// arreglar del lado del link; lo que sí se puede es no perder la compra:
//
//   1. Se pide el email y se crea la orden 'pendiente' ANTES de mandar a pagar, igual
//      que en el flujo automático. Así la compra existe en la plataforma.
//   2. La persona vuelve a /pedido/[id], que le explica que la confirmación es manual.
//   3. El psicólogo ve la orden en Ventas, la coteja contra su cuenta de Mercado Pago y
//      la confirma (confirmarPagoOrden) — ahí se habilita la descarga y sale el mail.
//
// El humano en el medio es inherente al link manual, no una decisión de diseño: sin
// webhook, nadie más puede saber que el pago entró. El flujo automático
// (iniciarCompraEbook) no necesita nada de esto y por eso tiene prioridad cuando está
// configurado.
export async function iniciarCompraEbookManual(ebookId: string, emailCrudo: string) {
  const email = normalizarEmail(emailCrudo)
  if (!email) return { error: 'Ingresá un email válido' }

  if (await demasiadasComprasPendientes(email)) {
    return { error: 'Ya tenés una compra en curso con ese email. Terminala o esperá un rato.' }
  }

  const supabase = await createClient()
  const { data: ebook } = await supabase
    .from('ebooks')
    .select('id, titulo, precio_centavos, link_pago')
    .eq('id', ebookId)
    .eq('estado', 'publicado')
    .maybeSingle()
  if (!ebook) return { error: 'Ese ebook ya no está disponible.' }

  // El link se re-lee acá y no se toma del cliente: el componente lo recibe como prop
  // para pintar el botón, pero a dónde se manda a pagar de verdad lo decide el servidor.
  const linkPago = typeof ebook.link_pago === 'string' ? ebook.link_pago.trim() : ''
  if (!linkPago || !esUrlHttpsSegura(linkPago)) {
    return { error: 'Todavía no está disponible el pago online para este ebook.' }
  }

  const orden = await crearOrdenPendiente(ebook, email, 'manual')
  if (!orden) return { error: 'No se pudo iniciar la compra. Intentá de nuevo.' }

  return { url: linkPago, ordenId: orden.id }
}

// Mismo criterio que guardarEbook en psicologo/ebooks/actions.ts (https obligatorio, sin
// allowlist de host porque el proveedor puede cambiar). Se revalida en la entrega y no
// solo al guardar: entre una cosa y la otra el valor pudo entrar por otro camino.
function esUrlHttpsSegura(valor: string): boolean {
  try { return new URL(valor).protocol === 'https:' } catch { return false }
}

// Entrega del PDF. Se llama desde /pedido/[id] — nunca antes de re-chequear acá que la
// orden esté 'pagada' server-side, sin importar lo que diga la URL o el estado que
// muestre la página. La URL que devuelve fuerza la descarga (Content-Disposition:
// attachment, vía firmarDescargaR2) y se firma de nuevo en cada click en vez de una vez
// y guardada: así una URL vieja copiada de la barra de direcciones no sirve para
// siempre.
export async function descargarEbookDeOrden(ordenId: string) {
  const supabaseAdmin = createAdminClient()
  const { data: orden } = await supabaseAdmin
    .from('ordenes')
    .select('estado, alumno_id, ebooks(titulo, archivo_key)')
    .eq('id', ordenId)
    .maybeSingle()

  if (!orden) return { error: 'No se encontró esa orden.' }
  if (orden.estado !== 'pagada') return { error: 'Esta orden todavía no tiene un pago confirmado.' }

  // Mientras nadie se la vincula, el ordenId ES el único acceso que existe (recién
  // salido del checkout, sin cuenta todavía) y tiene que seguir bastando. Pero apenas
  // hay alumno_id (fase 5: se creó una cuenta), dejarlo bastar solo a él convertiría la
  // compra en una capability URL que nunca vence ni se puede revocar — tiene que ser esa
  // persona la que pida la descarga.
  if (orden.alumno_id) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== orden.alumno_id) {
      return { error: 'Esta compra está asociada a una cuenta. Iniciá sesión para descargarla.' }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ebook = orden.ebooks as any
  const key = ebook?.archivo_key ? keyDeMarcadorR2(ebook.archivo_key) : null
  if (!key) return { error: 'No se encontró el archivo de este ebook.' }

  try {
    const url = await firmarDescargaR2(key, `${ebook.titulo}.pdf`)
    return { url }
  } catch (err) {
    console.error('No se pudo firmar la descarga del ebook:', err)
    return { error: 'No se pudo generar el link de descarga. Intentá de nuevo.' }
  }
}
