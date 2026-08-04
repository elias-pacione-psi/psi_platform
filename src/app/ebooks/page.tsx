import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { resolverUrlRecurso } from '@/utils/r2'
import { BrandMark } from '@/components/BrandMark'

export const metadata = { title: 'Ebooks | Elias Pacione' }

// Página pública, sin guard de sesión: es la vidriera. La policy ebooks_select ya
// restringe lo que devuelve esta consulta a estado='publicado' para quien no está
// autenticado como psicólogo (rol anon), así que ni hace falta filtrar acá — pero se
// filtra igual, explícito, para no depender en silencio de que la policy no cambie.
const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export default async function EbooksPage() {
  const supabase = await createClient()
  const { data: ebooks } = await supabase
    .from('ebooks')
    .select('id, slug, titulo, descripcion, portada_key, precio_centavos')
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false })

  const conPortada = await Promise.all(
    (ebooks ?? []).map(async (e) => ({ ...e, portada_url: await resolverUrlRecurso(e.portada_key) })),
  )

  return (
    <main className="min-h-screen bg-crema font-sans">
      <header className="w-full bg-crema/90 backdrop-blur border-b border-tinta/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="w-10 h-7 shrink-0 text-tinta" />
            <span className="font-heading font-semibold text-lg tracking-tight text-tinta">Elias Pacione</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-tinta/70 hover:text-tinta transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-heading font-semibold text-tinta mb-3">Ebooks</h1>
        <p className="text-tinta/70 max-w-2xl mb-12 font-serif">
          Material para leer a tu ritmo. Comprás y lo tenés al instante.
        </p>

        {conPortada.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-4" />
            Todavía no hay ebooks publicados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {conPortada.map((e) => (
              <Link
                key={e.id}
                href={`/ebooks/${e.slug}`}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-marca/40 hover:shadow-md transition-all flex flex-col"
              >
                <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                  {e.portada_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.portada_url} alt={e.titulo} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="font-heading font-semibold text-tinta text-lg leading-snug group-hover:text-marca transition-colors">
                    {e.titulo}
                  </h2>
                  {e.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 flex-1">{e.descripcion}</p>
                  )}
                  <p className="font-heading font-bold text-tinta mt-4">{formatoARS.format(e.precio_centavos / 100)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
