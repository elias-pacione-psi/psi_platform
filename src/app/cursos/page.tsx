import Link from 'next/link'
import { PlayCircle, BookOpen, ClipboardCheck, ArrowRight, Clock } from 'lucide-react'
import { ImagenMuestra } from '@/components/ImagenMuestra'
import { SiteHeader } from '@/components/SiteHeader'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { createClient } from '@/utils/supabase/server'
import { resolverUrlRecurso } from '@/utils/r2'

export const metadata = { title: 'Cursos | Elias Pacione' }

const PASOS = [
  {
    icono: BookOpen,
    titulo: 'Elias arma el programa',
    texto: 'Módulos y lecciones organizados, con video, lecturas y material de apoyo.',
  },
  {
    icono: Clock,
    titulo: 'Avanzás a tu ritmo',
    texto: 'Sin horarios fijos ni clases en vivo: entrás cuando podés y retomás donde quedaste.',
  },
  {
    icono: ClipboardCheck,
    titulo: 'Quiz de comprensión',
    texto: 'Cada módulo cierra con un quiz corto. Necesitás 70% para pasar al siguiente.',
  },
]

export default async function CursosPage() {
  const supabase = await createClient()
  const { data: programas } = await supabase
    .from('programas')
    .select('id, titulo, descripcion, descripcion_larga, portada_key')
    .eq('publicado_en_home', true)
    .order('created_at', { ascending: false })

  const programasPublicados = await Promise.all(
    (programas ?? []).map(async (p) => ({ ...p, portada_url: await resolverUrlRecurso(p.portada_key) })),
  )

  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-4">
              Curso asincrónico
            </p>
            <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-5 leading-[1.15] tracking-tight">
              Aprendé a tu ritmo, cuando puedas
            </h1>
            <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-8">
              Contenido grabado y organizado en módulos y lecciones, para ir avanzando
              cuando tengas tiempo — sin horarios fijos que cumplir.
            </p>
            <Link
              href="/?interes=curso#contacto"
              className="inline-flex items-center gap-2 bg-tinta text-crema px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca"
            >
              Quiero más información <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ImagenMuestra icon={PlayCircle} etiqueta="Lección grabada" variante="marca" />
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
            ¿Qué es un curso asincrónico?
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl">
            Es contenido ya grabado — videos, lecturas y ejercicios — que vas viendo
            cuando quieras, en el orden en que Elias lo pensó. No hay clases en vivo ni
            fechas de inscripción: entrás con tu usuario y avanzás lección por lección.
            Es la opción para quien prefiere aprender solo, a su propio ritmo.
          </p>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-10 tracking-tight">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
              <div key={titulo} className="bg-card rounded-2xl border border-border p-7">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-heading font-semibold text-marca text-sm">{`0${i + 1}`}</span>
                  <Icono className="w-6 h-6 text-marca" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-semibold text-tinta text-lg mb-2 tracking-tight">{titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CURSOS DISPONIBLES — programas reales marcados con publicado_en_home.
          Se oculta la sección entera si no hay ninguno todavía: un acordeón
          vacío en medio de una página informativa se vería roto. */}
      {programasPublicados.length > 0 && (
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-3 tracking-tight">
              Cursos disponibles
            </h2>
            <p className="font-serif text-tinta/75 text-base leading-relaxed mb-10 max-w-2xl">
              Elegí un curso para ver de qué se trata.
            </p>
            <Accordion className="w-full space-y-4">
              {programasPublicados.map((p) => (
                <AccordionItem
                  key={p.id}
                  value={p.id}
                  className="border border-border rounded-xl px-4 bg-card data-[state=open]:shadow-md transition-all"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {p.portada_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.portada_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <span className="font-heading font-semibold text-lg text-tinta block">{p.titulo}</span>
                        {p.descripcion && (
                          <span className="font-sans text-sm text-muted-foreground font-normal line-clamp-1">{p.descripcion}</span>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 border-t border-border">
                    <div className="grid md:grid-cols-[200px_1fr] gap-6 mt-4 items-start">
                      {p.portada_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.portada_url} alt={p.titulo} className="w-full aspect-[4/3] object-cover rounded-xl border border-border" />
                      ) : (
                        <div className="w-full aspect-[4/3] rounded-xl border border-dashed border-border bg-muted flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-serif text-tinta/80 text-base leading-relaxed whitespace-pre-line">
                          {p.descripcion_larga || p.descripcion || 'Muy pronto vamos a sumar más detalle sobre este curso.'}
                        </p>
                        <Link
                          href="/?interes=curso#contacto"
                          className="inline-flex items-center gap-2 mt-6 bg-tinta text-crema px-6 py-2.5 rounded-full font-medium text-sm transition-colors hover:bg-marca"
                        >
                          Quiero más información <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* PARA QUIÉN ES + imágenes */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <ImagenMuestra icon={BookOpen} etiqueta="Módulo con material de apoyo" variante="sage" className="md:order-2" />
          <div className="md:order-1">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
              ¿Para quién es?
            </h2>
            <ul className="font-serif text-tinta/75 text-base leading-relaxed space-y-3">
              <li>· Para quien tiene una agenda apretada y necesita flexibilidad de horarios.</li>
              <li>· Para quien prefiere estudiar solo, sin la dinámica de un grupo.</li>
              <li>· Para quien ya tiene una base y quiere profundizar un tema puntual.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-tinta">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-crema text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            ¿Te interesa este curso?
          </h2>
          <p className="font-serif text-crema/75 text-base leading-relaxed mb-8">
            Los cursos no se compran online: contanos qué te interesa y Elias te
            escribe para coordinar el acceso.
          </p>
          <Link
            href="/?interes=curso#contacto"
            className="inline-flex items-center gap-2 bg-crema text-tinta px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca hover:text-crema"
          >
            Quiero más información <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
