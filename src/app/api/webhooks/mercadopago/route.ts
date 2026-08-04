import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { obtenerPagoMP, verificarFirmaWebhookMP } from '@/utils/mercadopago'

// Mercado Pago pega acá cada vez que cambia el estado de un pago.
//
// SIN VERIFICAR CONTRA UN WEBHOOK REAL — no hay credenciales de Mercado Pago en este
// entorno (ver docs/plan-modelo-comercial.md, fase 4). Antes de la primera venta real:
// probar el flujo completo (preferencia → checkout → esta ruta → orden 'pagada') contra
// el sandbox de Mercado Pago.
//
// Reglas de este endpoint, en orden — ninguna es opcional:
// 1. Verificar la firma ANTES de tocar cualquier dato. Sin esto, cualquiera que supiera
//    esta URL podría mandar un POST fingiendo un pago aprobado y regalarse el ebook.
// 2. Nunca confiar en el status que venga en el body: se vuelve a pedir el pago a la API
//    de Mercado Pago con el id, y ESE status (no el que mandó la notificación) es la
//    verdad que se guarda.
// 3. Idempotente: Mercado Pago reintenta notificaciones — si la orden ya está 'pagada',
//    se responde 200 sin tocar nada de nuevo.
// 4. Responder 200 siempre que se haya podido procesar la notificación, incluso si el
//    pago en sí vino rechazado: un 4xx/5xx hace que Mercado Pago reintente sin parar.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const dataId = (body?.data?.id as string | undefined) ?? request.nextUrl.searchParams.get('data.id') ?? undefined

  // Mercado Pago manda notificaciones de varios tipos (payment, merchant_order, etc.);
  // solo interesan las que traen un id de pago.
  if (!dataId) return NextResponse.json({ ok: true })

  const firmaValida = verificarFirmaWebhookMP({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataId,
  })
  if (!firmaValida) {
    console.error('Webhook de Mercado Pago con firma inválida — ignorado')
    return NextResponse.json({ error: 'firma inválida' }, { status: 401 })
  }

  const pago = await obtenerPagoMP(dataId)
  if (!pago || !pago.externalReference) return NextResponse.json({ ok: true })

  const supabaseAdmin = createAdminClient()
  const { data: orden } = await supabaseAdmin
    .from('ordenes')
    .select('id, estado')
    .eq('id', pago.externalReference)
    .maybeSingle()

  // external_reference que no matchea ninguna orden nuestra: de otra integración, de
  // pruebas en el panel de Mercado Pago, o de un ambiente distinto. Se ignora sin error.
  if (!orden) return NextResponse.json({ ok: true })
  if (orden.estado === 'pagada') return NextResponse.json({ ok: true })

  if (pago.status === 'approved') {
    await supabaseAdmin
      .from('ordenes')
      .update({ estado: 'pagada', pagada_at: new Date().toISOString(), referencia_externa: pago.id })
      .eq('id', orden.id)
  } else if (pago.status === 'rejected' || pago.status === 'cancelled') {
    await supabaseAdmin
      .from('ordenes')
      .update({ estado: 'fallida', referencia_externa: pago.id })
      .eq('id', orden.id)
  }
  // 'pending' / 'in_process' / etc.: se deja la orden como está. Mercado Pago manda otra
  // notificación cuando el pago cambie de estado.

  return NextResponse.json({ ok: true })
}
