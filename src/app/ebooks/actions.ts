'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { crearPreferenciaMP, mercadoPagoConfigurado } from '@/utils/mercadopago'
import { firmarDescargaR2 } from '@/utils/r2'
import { keyDeMarcadorR2 } from '@/utils/r2-marcador'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Endpoint público (lo llama cualquiera desde /ebooks/[slug], sin sesión): valida y
// acota todo, igual que crearSolicitud en app/actions.ts.
export async function iniciarCompraEbook(ebookId: string, emailCrudo: string) {
  const email = (emailCrudo ?? '').trim().toLowerCase()
  if (!email || email.length > 254 || !RE_EMAIL.test(email)) {
    return { error: 'Ingresá un email válido' }
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

  // Con service-role: quien compra no tiene sesión (la cuenta, si la crea, es posterior
  // y opcional — fase 5), así que no hay auth.uid() con el que la policy de `ordenes`
  // pudiera dejar pasar el insert por RLS normal.
  const supabaseAdmin = createAdminClient()
  const { data: orden, error: errorOrden } = await supabaseAdmin
    .from('ordenes')
    .insert({
      ebook_id: ebook.id,
      email_comprador: email,
      precio_cobrado: ebook.precio_centavos,
      moneda: 'ARS',
      estado: 'pendiente',
    })
    .select('id')
    .single()

  if (errorOrden || !orden) {
    console.error('No se pudo crear la orden:', errorOrden?.message)
    return { error: 'No se pudo iniciar la compra. Intentá de nuevo.' }
  }

  const preferencia = await crearPreferenciaMP({
    ordenId: orden.id,
    titulo: ebook.titulo,
    precioArs: ebook.precio_centavos / 100,
    email,
  })

  if ('error' in preferencia) {
    // La orden queda registrada (para no perder el intento) pero marcada como lo que
    // fue: nunca llegó a tener un checkout real donde alguien pudiera pagar.
    await supabaseAdmin.from('ordenes').update({ estado: 'fallida' }).eq('id', orden.id)
    return { error: preferencia.error }
  }

  return { url: preferencia.initPoint }
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
    .select('estado, ebooks(titulo, archivo_key)')
    .eq('id', ordenId)
    .maybeSingle()

  if (!orden) return { error: 'No se encontró esa orden.' }
  if (orden.estado !== 'pagada') return { error: 'Esta orden todavía no tiene un pago confirmado.' }

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
