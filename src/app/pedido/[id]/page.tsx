import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock, TriangleAlert } from 'lucide-react'
import { createAdminClient } from '@/utils/supabase/admin'
import { BrandMark } from '@/components/BrandMark'
import { DescargarBoton } from './DescargarBoton'

export const metadata = { title: 'Tu pedido | Elias Pacione' }

type Props = { params: Promise<{ id: string }> }

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
    .select('id, estado, email_comprador, ebooks(titulo, slug)')
    .eq('id', id)
    .maybeSingle()

  if (!orden) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ebook = orden.ebooks as any

  return (
    <main className="min-h-screen bg-crema font-sans">
      {/* Mientras el pago sigue 'pendiente' (el webhook puede tardar unos segundos más
          que el redirect de vuelta desde Mercado Pago), la página se refresca sola cada
          5s hasta que cambie de estado — sin JS de por medio, para que funcione incluso
          si algo falla del lado del cliente. */}
      {orden.estado === 'pendiente' && <meta httpEquiv="refresh" content="5" />}

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
            </>
          )}

          {orden.estado === 'pendiente' && (
            <>
              <Clock className="w-12 h-12 text-marca mx-auto mb-4 animate-pulse" />
              <h1 className="text-2xl font-heading font-semibold text-tinta mb-2">Estamos confirmando tu pago</h1>
              <p className="text-muted-foreground">
                Puede tardar unos segundos. Esta página se actualiza sola — no hace falta que hagas nada.
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
