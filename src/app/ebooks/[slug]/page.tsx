import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { resolverUrlRecurso } from '@/utils/r2'
import { BrandMark } from '@/components/BrandMark'
import { ComprarEbookButton } from '@/components/ComprarEbookButton'

const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: ebook } = await supabase.from('ebooks').select('titulo').eq('slug', slug).eq('estado', 'publicado').maybeSingle()
  return { title: ebook ? `${ebook.titulo} | Elias Pacione` : 'Ebook | Elias Pacione' }
}

export default async function EbookDetallePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // .eq('estado', 'publicado') explícito acá también: un borrador no debería poder
  // visitarse por URL directa aunque alguien adivine o comparta el slug.
  const { data: ebook } = await supabase
    .from('ebooks')
    .select('id, slug, titulo, descripcion, portada_key, precio_centavos')
    .eq('slug', slug)
    .eq('estado', 'publicado')
    .maybeSingle()

  if (!ebook) notFound()

  const portadaUrl = await resolverUrlRecurso(ebook.portada_key)

  return (
    <main className="min-h-screen bg-crema font-sans">
      <header className="w-full bg-crema/90 backdrop-blur border-b border-tinta/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-10">
          <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden flex items-center justify-center border border-border shadow-sm">
            {portadaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portadaUrl} alt={ebook.titulo} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="w-14 h-14 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-heading font-semibold text-tinta mb-3 leading-tight">{ebook.titulo}</h1>
            <p className="text-2xl font-heading font-bold text-marca mb-6">
              {formatoARS.format(ebook.precio_centavos / 100)}
            </p>
            {ebook.descripcion && (
              <p className="text-tinta/80 font-serif leading-relaxed mb-8 whitespace-pre-wrap">{ebook.descripcion}</p>
            )}
            <div className="mt-auto max-w-sm">
              <ComprarEbookButton />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
