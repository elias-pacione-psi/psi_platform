import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  obtenerPagoMP,
  obtenerPagosDeMerchantOrderMP,
  verificarFirmaWebhookMP,
} from '@/utils/mercadopago'
import { aplicarPagoAOrden } from '@/utils/supabase/ordenes'

// Mercado Pago pega acá cada vez que cambia el estado de un pago.
//
// Reglas de este endpoint, en orden — ninguna es opcional:
// 1. Verificar la firma ANTES de tocar cualquier dato. Sin esto, cualquiera que supiera
//    esta URL podría mandar un POST fingiendo un pago aprobado y regalarse el ebook.
// 2. Nunca confiar en el status que venga en el body: se vuelve a pedir el pago a la API
//    de Mercado Pago con el id, y ESE status (no el que mandó la notificación) es la
//    verdad que se guarda.
// 3. Idempotente: Mercado Pago reintenta notificaciones con backoff hasta ~24h. La
//    transición y el mail los cierra aplicarPagoAOrden con un update condicionado a
//    'pendiente', así que un reintento no vuelve a mandar nada.
// 4. Responder 200 siempre que se haya podido procesar la notificación, incluso si el
//    pago en sí vino rechazado: un 4xx/5xx hace que Mercado Pago reintente sin parar.
//
// Este webhook dejó de ser el ÚNICO camino de confirmación (2026-09-05): la vuelta del
// checkout a /pedido/[id] concilia el pago por su cuenta con el payment_id del back_url.
// Los dos terminan en aplicarPagoAOrden y el primero que llega gana.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const query = request.nextUrl.searchParams

  // Mercado Pago manda el id en el body (`data.id`) y en el query (`data.id`), y en el
  // formato IPN viejo como `?id=&topic=`. Se leen los tres: el manifest de la firma se
  // arma con el del query según la doc y con el del body según el skill oficial, así que
  // verificarFirmaWebhookMP recibe ambos y prueba las dos variantes.
  const dataIdQuery = query.get('data.id') ?? query.get('id')
  const dataIdBody = typeof body?.data?.id === 'string' || typeof body?.data?.id === 'number'
    ? String(body.data.id)
    : null
  const dataId = dataIdBody ?? dataIdQuery
  if (!dataId) return NextResponse.json({ ok: true })

  const firmaValida = verificarFirmaWebhookMP({
    xSignature: request.headers.get('x-signature'),
    xRequestId: request.headers.get('x-request-id'),
    dataIdQuery,
    dataIdBody,
  })
  if (!firmaValida) {
    console.error('Webhook de Mercado Pago con firma inválida — ignorado')
    return NextResponse.json({ error: 'firma inválida' }, { status: 401 })
  }

  // Checkout Pro notifica con más de un topic. Con 'merchant_order' el data.id NO es un
  // id de pago: pedirlo como /v1/payments/{id} daba 404 y la notificación se perdía en
  // silencio. Ahí hay que abrir la merchant order y mirar los pagos que cuelgan de ella.
  const topic = String(body?.type ?? body?.topic ?? query.get('type') ?? query.get('topic') ?? 'payment')

  let idsDePago: string[]
  if (topic === 'merchant_order') {
    idsDePago = await obtenerPagosDeMerchantOrderMP(dataId)
  } else if (topic === 'payment') {
    idsDePago = [dataId]
  } else {
    // Otros topics (chargebacks, suscripciones, point…) no aplican a la venta de ebooks.
    return NextResponse.json({ ok: true })
  }

  for (const idPago of idsDePago) {
    const pago = await obtenerPagoMP(idPago)
    if (!pago) continue

    const res = await aplicarPagoAOrden(pago)
    if (res.resultado === 'pagada' || res.resultado === 'fallida') {
      revalidatePath(`/pedido/${res.ordenId}`)
      revalidatePath('/psicologo/ventas')
    }
  }

  return NextResponse.json({ ok: true })
}

// El panel de Mercado Pago hace un request de prueba contra la URL al registrarla en
// "Tus integraciones → Webhooks". Sin un GET, esa comprobación ve un 405 y la URL queda
// como no válida — que es lo primero que hay que poder hacer para que este webhook
// empiece a llegar. No expone nada: no lee ni toca ninguna orden.
export async function GET() {
  return NextResponse.json({ ok: true, webhook: 'mercadopago' })
}
