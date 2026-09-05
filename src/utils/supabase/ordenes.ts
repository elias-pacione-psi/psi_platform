import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import { enviarMail } from '@/utils/email/resend'
import { EbookListoEmail } from '@/emails/EbookListoEmail'
import { baseUrl } from '@/utils/site-url'
import type { PagoMP } from '@/utils/mercadopago'

// Transición de una orden a partir de un pago ya confirmado contra la API de Mercado
// Pago. Vive acá, con service-role, y no en cada lugar que la necesita, porque hay DOS
// caminos por los que se entera la plataforma de que un pago entró y tienen que decidir
// exactamente lo mismo:
//
//   1. El webhook (/api/webhooks/mercadopago), cuando Mercado Pago avisa.
//   2. La vuelta del checkout a /pedido/[id], con el payment_id que Mercado Pago pega en
//      el query string del back_url.
//
// Tenerlos duplicados era parte del problema: el webhook marcaba 'pagada' y mandaba el
// mail, y la página no hacía nada más que esperarlo. Si el webhook no llegaba —que es
// justo lo que estaba pasando— no había segundo camino.
//
// Service-role a propósito: quien compra puede no tener sesión (la cuenta es posterior y
// opcional, fase 5 del plan), así que no hay auth.uid() con el que la policy de `ordenes`
// pudiera dejar pasar el update.

export type ResultadoPago =
  | { resultado: 'pagada'; ordenId: string } // transicionó ahora (y salió el mail)
  | { resultado: 'fallida'; ordenId: string }
  | { resultado: 'sin-cambios'; ordenId: string } // ya estaba pagada/reembolsada, o sigue pendiente
  | { resultado: 'orden-desconocida' }

type OrdenParaPago = {
  id: string
  estado: string
  email_comprador: string
  proveedor: string
  precio_cobrado: number
  ebooks: unknown
}

const COLUMNAS = 'id, estado, email_comprador, proveedor, precio_cobrado, ebooks(titulo)'

// El link de pago manual (mpago.la, cargado a mano en el admin) es una URL estática: no
// lleva external_reference, así que del pago no vuelve nada que apunte a una orden. Pero
// si el webhook está registrado a nivel aplicación en el panel de Mercado Pago, la
// notificación llega igual — solo que sin con qué matchearla.
//
// Este es el único caso en que se busca la orden por otra cosa, y con el cerrojo puesto:
// tiene que ser una sola orden 'pendiente', de proveedor 'manual', con el MISMO email que
// pagó y el MISMO importe exacto. Si hay más de una candidata no se elige ninguna: entre
// confirmarle el ebook a la persona equivocada y dejar que el psicólogo confirme a mano
// —que es como funcionaba hasta ahora— la segunda es la que no se puede deshacer mal.
async function buscarOrdenManualPorPago(pago: PagoMP): Promise<OrdenParaPago | null> {
  if (!pago.emailPagador || pago.montoCentavos === null) return null

  const supabaseAdmin = createAdminClient()
  const { data: candidatas } = await supabaseAdmin
    .from('ordenes')
    .select(COLUMNAS)
    .eq('estado', 'pendiente')
    .eq('proveedor', 'manual')
    .eq('email_comprador', pago.emailPagador)
    .eq('precio_cobrado', pago.montoCentavos)
    .limit(2)

  if (!candidatas || candidatas.length === 0) return null
  if (candidatas.length > 1) {
    console.error(
      `Pago ${pago.id} de Mercado Pago matchea más de una orden manual pendiente ` +
      `(${pago.emailPagador}, ${pago.montoCentavos} centavos) — se deja para confirmación manual.`,
    )
    return null
  }
  return candidatas[0] as OrdenParaPago
}

export async function aplicarPagoAOrden(
  pago: PagoMP,
  opciones: { onPagada?: (ordenId: string) => void } = {},
): Promise<ResultadoPago> {
  const supabaseAdmin = createAdminClient()

  let orden: OrdenParaPago | null = null
  if (pago.externalReference) {
    const { data } = await supabaseAdmin
      .from('ordenes')
      .select(COLUMNAS)
      .eq('id', pago.externalReference)
      .maybeSingle()
    orden = (data as OrdenParaPago | null) ?? null
  }
  // Sin external_reference que matchee: puede ser el link de pago manual, otra
  // integración, una prueba del panel de Mercado Pago o un ambiente distinto.
  if (!orden) orden = await buscarOrdenManualPorPago(pago)
  if (!orden) return { resultado: 'orden-desconocida' }

  // Una orden reembolsada es un estado FINAL decidido por fuera de acá. Sin este corte,
  // una notificación 'approved' que llegara tarde (reintento de Mercado Pago sobre el
  // pago original, posterior al reembolso) la devolvía a 'pagada' — y con eso, el
  // comprador recuperaba la descarga de algo que ya se le devolvió.
  if (orden.estado === 'pagada' || orden.estado === 'reembolsada') {
    return { resultado: 'sin-cambios', ordenId: orden.id }
  }

  if (pago.status === 'approved') {
    // `.eq('estado', 'pendiente')` en el propio update, no solo en la lectura de arriba:
    // el webhook y la vuelta del checkout pueden llegar a la vez (es lo normal, no un
    // caso raro) y los dos habrían leído 'pendiente'. Con el filtro en el update, el
    // segundo no matchea ninguna fila — y por eso el mail sale una sola vez. Mismo
    // cerrojo que ya usa confirmarPagoOrden en psicologo/ventas/actions.ts.
    const { data: actualizada, error } = await supabaseAdmin
      .from('ordenes')
      .update({
        estado: 'pagada',
        pagada_at: new Date().toISOString(),
        referencia_externa: pago.id,
      })
      .eq('id', orden.id)
      .eq('estado', 'pendiente')
      .select('id')

    // Un error acá deja la orden 'pendiente' a propósito (el psicólogo la confirma desde
    // Ventas), pero tiene que quedar en los logs: si no, es una venta cobrada que no se
    // entregó y nadie se entera. El caso realista es el índice único
    // (proveedor, referencia_externa): el mismo pago intentando entrar en dos órdenes.
    if (error) {
      console.error(`No se pudo marcar como pagada la orden ${orden.id} (pago ${pago.id}):`, error.message)
      return { resultado: 'sin-cambios', ordenId: orden.id }
    }
    if (!actualizada || actualizada.length === 0) {
      return { resultado: 'sin-cambios', ordenId: orden.id }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const titulo = (orden.ebooks as any)?.titulo ?? 'tu ebook'

    // El mail es la red de seguridad de la entrega: si la persona cerró la pestaña antes
    // de que se acreditara, este link es la única forma que le queda de llegar al PDF. Si
    // el envío falla, la orden igual queda 'pagada' — la descarga ya está habilitada y el
    // link del pedido sigue sirviendo, así que no hay nada que revertir.
    try {
      await enviarMail({
        to: orden.email_comprador,
        subject: `Ya podés descargar ${titulo}`,
        react: EbookListoEmail({ tituloEbook: titulo, urlPedido: `${baseUrl()}/pedido/${orden.id}` }),
        tipo: 'ebook_entregado',
        // Sin alumno: se puede comprar sin cuenta. La trazabilidad del envío queda por
        // destinatario_email y referencia_id.
        alumnoId: null,
        referenciaId: orden.id,
      })
    } catch (err) {
      console.error('Error enviando el mail de entrega del ebook:', err)
    }

    opciones.onPagada?.(orden.id)
    return { resultado: 'pagada', ordenId: orden.id }
  }

  if (pago.status === 'rejected' || pago.status === 'cancelled') {
    await supabaseAdmin
      .from('ordenes')
      .update({ estado: 'fallida', referencia_externa: pago.id })
      .eq('id', orden.id)
      .eq('estado', 'pendiente')
    return { resultado: 'fallida', ordenId: orden.id }
  }

  // 'pending' / 'in_process' / 'authorized' / etc.: se deja la orden como está. Mercado
  // Pago manda otra notificación cuando el pago cambie de estado.
  return { resultado: 'sin-cambios', ordenId: orden.id }
}
