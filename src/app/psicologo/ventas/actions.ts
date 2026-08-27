'use server'

import { revalidatePath } from 'next/cache'
import { requirePsicologo } from '@/utils/supabase/guards'
import { enviarMail } from '@/utils/email/resend'
import { EbookListoEmail } from '@/emails/EbookListoEmail'
import { baseUrl } from '@/utils/site-url'

// Marca la orden como reembolsada de este lado — NO devuelve la plata. Eso se hace en el
// panel de Mercado Pago (ahí es donde vive la plata de verdad); esta acción es la
// contraparte administrativa: registra que se reembolsó y, con eso, descargarEbookDeOrden
// deja de entregar el PDF (exige estado === 'pagada' exacto). Sin este paso manual, un
// comprador reembolsado seguiría pudiendo bajar el ebook indefinidamente.
export async function marcarOrdenReembolsada(ordenId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: orden } = await supabase.from('ordenes').select('estado').eq('id', ordenId).maybeSingle()
  if (!orden) return { error: 'No se encontró esa orden.' }
  if (orden.estado !== 'pagada') return { error: 'Solo se puede reembolsar una orden que esté pagada.' }

  const { error } = await supabase.from('ordenes').update({ estado: 'reembolsada' }).eq('id', ordenId)
  if (error) return { error: error.message }

  // La pestaña Ventas vive en /psicologo/ebooks desde la fusión con esa página —
  // revalidar /psicologo/ventas (ahora solo un redirect) no invalidaría nada real.
  revalidatePath('/psicologo/ebooks')
  return { success: true }
}

// Confirma a mano el pago de una orden y, con eso, habilita la descarga del PDF.
//
// Existe por el link de pago manual (ebooks.link_pago): esa vía no manda webhook, así que
// nadie más que el psicólogo puede saber que la plata entró. Es el paso que cierra el
// flujo — sin esto, una compra por link manual se queda en 'pendiente' para siempre y el
// comprador nunca recibe lo que pagó (el bug del 2026-08-28).
//
// Solo desde 'pendiente', y a propósito:
//   - 'pagada' ya está, no hay nada que confirmar (y re-confirmar pisaría pagada_at).
//   - 'reembolsada' es un estado final: reactivarla le devolvería la descarga a alguien
//     a quien ya se le devolvió la plata. Mismo corte que hace el webhook.
//   - 'fallida' es un intento que nunca tuvo checkout; si hay que cobrarla, se hace una
//     orden nueva en vez de resucitar esta.
export async function confirmarPagoOrden(ordenId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: orden } = await supabase
    .from('ordenes')
    .select('id, estado, email_comprador, ebooks(titulo)')
    .eq('id', ordenId)
    .maybeSingle()

  if (!orden) return { error: 'No se encontró esa orden.' }
  if (orden.estado === 'pagada') return { error: 'Esta orden ya estaba confirmada.' }
  if (orden.estado !== 'pendiente') {
    return { error: `No se puede confirmar una orden ${orden.estado}.` }
  }

  // .eq('estado', 'pendiente') también en el update, no solo en la lectura de arriba: dos
  // clicks seguidos (o dos pestañas del admin) llegarían los dos hasta acá con la misma
  // lectura 'pendiente' y el segundo pisaría pagada_at y mandaría el mail de nuevo. Con
  // el filtro en el propio update, el segundo no matchea ninguna fila.
  const { data: actualizada, error } = await supabase
    .from('ordenes')
    .update({ estado: 'pagada', pagada_at: new Date().toISOString() })
    .eq('id', ordenId)
    .eq('estado', 'pendiente')
    .select('id')
  if (error) return { error: error.message }
  if (!actualizada || actualizada.length === 0) {
    return { error: 'Esta orden ya estaba confirmada.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titulo = (orden.ebooks as any)?.titulo ?? 'tu ebook'

  // El mail es la red de seguridad del flujo manual: entre que la persona paga y que se
  // confirma pasa un rato, y para entonces lo más probable es que ya haya cerrado la
  // pestaña del pedido. Si el envío falla, la orden igual queda 'pagada' — la descarga ya
  // está habilitada y el link del pedido sigue sirviendo, así que no hay nada que revertir.
  const mail = await enviarMail({
    to: orden.email_comprador,
    subject: `Ya podés descargar ${titulo}`,
    react: EbookListoEmail({ tituloEbook: titulo, urlPedido: `${baseUrl()}/pedido/${orden.id}` }),
    tipo: 'ebook_entregado',
    // Sin alumno: se puede comprar sin cuenta. La trazabilidad del envío queda por
    // destinatario_email y referencia_id.
    alumnoId: null,
    referenciaId: orden.id,
  })

  revalidatePath('/psicologo/ebooks')
  revalidatePath(`/pedido/${orden.id}`)

  // El aviso vuelve al cliente para que el psicólogo sepa que tiene que pasar el link a
  // mano — un fallo de Resend que solo quede en los logs es un comprador esperando un
  // mail que no va a llegar.
  if (!mail.ok) {
    return { success: true, avisoMail: 'La orden quedó confirmada, pero no se pudo enviar el mail al comprador. Pasale el link del pedido a mano.' }
  }
  return { success: true }
}
