import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock, CreditCard, TriangleAlert } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import { BrandMark } from '@/components/BrandMark'
import { RecomendacionCursos } from '@/components/RecomendacionCursos'
import { DescargarBoton } from './DescargarBoton'

export const metadata = { title: 'Tu pedido | Elias Pacione' }

type Props = { params: Promise<{ id: string }> }

// El id de la orden funciona como capability URL: quien lo tiene, ve la página. Sirve para
// confirmar la compra, pero no hay motivo para que además muestre el email completo de
// quien pagó — con el link reenviado o en el historial de un navegador compartido, eso es
// un dato personal de más (Ley 25.326). Alcanza con que la persona reconozca el suyo.
function enmascararEmail(email: string): string {
  const [usuario, dominio] = email.split('@')
  if (!dominio) return '•••'
  const visible = usuario.slice(0, 2)
  return `${visible}${'•'.repeat(Math.max(usuario.length - 2, 1))}@${dominio}`
}

// Página pública a la que Mercado Pago devuelve a quien compró (back_urls de la
// preferencia, en utils/mercadopago.ts) — sin sesión, así que se lee con admin client.
// El id de la orden (un uuid, imposible de adivinar) es lo único que hace falta para
// consultar el estado: no hace falta login para ver "tu" pedido porque quien compró
// puede no tener cuenta todavía (la cuenta es posterior y opcional, ver fase 5 del plan).
export default async function PedidoPage({ params }: Props) {
  const { id } = await params
  const supabaseAdmin = createAdminClient()

  const { data: orden } = await supabaseAdmin
    .from('ordenes')
    .select('id, estado, email_comprador, alumno_id, proveedor, ebooks(titulo, slug, link_pago)')
    .eq('id', id)
    .maybeSingle()

  if (!orden) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ebook = orden.ebooks as any

  // Orden creada desde un link de pago manual (ebooks.link_pago). Del pago no vuelve
  // ninguna notificación, así que a diferencia del flujo automático esta orden NO se
  // confirma sola: la habilita el psicólogo desde Ventas después de ver la plata en su
  // cuenta. La página tiene que decir eso, no "esperá unos segundos".
  const esManual = orden.proveedor === 'manual'
  const linkPago: string | null =
    typeof ebook?.link_pago === 'string' && ebook.link_pago.startsWith('https://')
      ? ebook.link_pago
      : null

  return (
    <main className="min-h-screen bg-crema font-sans">
      {/* Mientras el pago sigue 'pendiente' la página se refresca sola hasta que cambie
          de estado — sin JS de por medio, para que funcione incluso si algo falla del
          lado del cliente. Cada 5s en el flujo automático, donde el webhook puede tardar
          unos segundos más que el redirect de vuelta desde Mercado Pago; cada 30s en el
          manual, donde del otro lado hay una persona confirmando y refrescar seis veces
          por minuto durante media hora no acerca la respuesta. */}
      {orden.estado === 'pendiente' && <meta httpEquiv="refresh" content={esManual ? '30' : '5'} />}

      <header className="w-full bg-crema/90 backdrop-blur border-b border-tinta/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="w-10 h-7 shrink-0 text-tinta" />
            <span className="font-heading font-semibold text-lg tracking-tight text-tinta">Elias Pacione</span>
          </Link>
          <Link href="/ebooks" className="flex items-center gap-2 text-sm text-tinta/70 hover:text-tinta transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Todos los ebooks
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          {orden.estado === 'pagada' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-marca mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-semibold text-tinta mb-2">¡Listo, {ebook?.titulo}!</h1>
              <p className="text-muted-foreground mb-6">Tu pago se acreditó. Ya podés descargar tu ebook.</p>
              <DescargarBoton ordenId={orden.id} />

              {/* Orden de la pantalla, a propósito: primero la descarga (es lo que la
                  persona pagó), después la cuenta, y recién al final la recomendación de
                  cursos. Invertirlo sería ponerle una oferta adelante a algo que ya
                  compró y todavía no recibió. */}
              {!orden.alumno_id && (
                <div className="mt-6 pt-6 border-t border-border text-left">
                  <p className="font-heading font-semibold text-tinta mb-1">
                    ¿Querés no depender de este link?
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Creá una cuenta con {enmascararEmail(orden.email_comprador)} y volvé a
                    descargarlo cuando quieras, desde cualquier dispositivo.
                  </p>
                  {/* Se manda el id de la orden y no el email: un email en el query string
                      viaja al historial del navegador, a los logs del server y al Referer.
                      /crear-cuenta lo resuelve server-side desde esta misma orden. */}
                  <Link
                    href={`/crear-cuenta?orden=${orden.id}`}
                    className="inline-flex items-center justify-center w-full bg-tinta hover:bg-marca text-crema font-bold h-12 rounded-xl transition-colors"
                  >
                    Crear mi cuenta
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <RecomendacionCursos />
              </div>
            </>
          )}

          {orden.estado === 'pendiente' && !esManual && (
            <>
              <Clock className="w-12 h-12 text-marca mx-auto mb-4 animate-pulse" />
              <h1 className="text-2xl font-heading font-semibold text-tinta mb-2">Estamos confirmando tu pago</h1>
              <p className="text-muted-foreground">
                Puede tardar unos segundos. Esta página se actualiza sola — no hace falta que hagas nada.
              </p>
            </>
          )}

          {orden.estado === 'pendiente' && esManual && (
            <>
              <CreditCard className="w-12 h-12 text-marca mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-semibold text-tinta mb-2">
                Tu pedido de {ebook?.titulo} está reservado
              </h1>
              <p className="text-muted-foreground mb-6">
                Guardá esta página: es desde acá que vas a descargar el ebook. También te
                mandamos el link a {enmascararEmail(orden.email_comprador)} cuando esté listo.
              </p>

              {linkPago && (
                <>
                  {/* target="_blank" a propósito: el pago se abre en otra pestaña para
                      que ESTA quede viva. Es la única que sabe cuál es esta orden — la
                      pantalla de "pago acreditado" de Mercado Pago no tiene forma de
                      volver acá, así que si se navega encima, el pedido se pierde de
                      vista. rel="noopener" porque el destino es un sitio externo. */}
                  <a
                    href={linkPago}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-marca hover:bg-marca/90 text-crema font-bold h-14 rounded-xl text-lg transition-colors"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Ir a pagar
                  </a>
                  <p className="text-sm text-muted-foreground mt-3">
                    Se abre en una pestaña nueva. Cuando termines, volvé acá.
                  </p>
                </>
              )}

              <p className="text-sm text-muted-foreground mt-6 pt-6 border-t border-border">
                ¿Ya pagaste? Este pago lo confirmamos a mano, así que puede tardar un rato
                (no es instantáneo). Apenas lo confirmemos te llega el mail y el botón de
                descarga aparece acá solo.
              </p>
            </>
          )}

          {orden.estado === 'fallida' && (
            <>
              <TriangleAlert className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-semibold text-tinta mb-2">El pago no se pudo confirmar</h1>
              <p className="text-muted-foreground mb-6">No te cobramos nada. Podés intentarlo de nuevo cuando quieras.</p>
              {ebook?.slug && (
                <Link href={`/ebooks/${ebook.slug}`} className="inline-block bg-marca hover:bg-marca/90 text-crema font-bold px-8 py-3 rounded-xl transition-colors">
                  Volver al ebook
                </Link>
              )}
            </>
          )}

          {orden.estado === 'reembolsada' && (
            <>
              <TriangleAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-heading font-semibold text-tinta mb-2">Esta compra fue reembolsada</h1>
              <p className="text-muted-foreground">Si no lo esperabas, escribinos por el formulario de Consultas.</p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
