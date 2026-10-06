import Link from 'next/link'
import { PlayCircle, BookOpen, ClipboardCheck, ArrowRight, Clock, Users, Presentation } from 'lucide-react'
import { IlustracionSitio } from '@/components/IlustracionSitio'
import { DescripcionPrograma } from '@/components/DescripcionPrograma'
import { SiteHeader } from '@/components/SiteHeader'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { createClient } from '@/utils/supabase/server'
import { resolverUrlRecurso, existeEnR2, firmarUrlR2, r2Configurado } from '@/utils/r2'

export const metadata = { title: 'Cursos | Elias Pacione' }

// Video de muestra del hero: a diferencia de portada_key (por programa, en la DB), es un
// único archivo fijo para esta página, así que la key vive acá igual que el slug de
// IlustracionSitio de al lado. Si el día de mañana se sube contenido nuevo con el mismo
// nombre en esta carpeta, alcanza con reemplazar el archivo en el bucket.
const KEY_VIDEO_HERO_CURSOS = 'Biblioteca R2/Videos/Videos Main Principal/Cursos asincronicos.mp4'

// Mismo cuidado que resolverIlustracion: firmar es cálculo local, no confirma que el archivo
// exista, así que sin el existeEnR2 una key movida o borrada dejaría un <video> roto en una
// página pública. Devolver null hace que el hero caiga a la ilustración de siempre.
async function firmarVideoHeroCursos(): Promise<string | null> {
  if (!r2Configurado()) return null
  try {
    if (!(await existeEnR2(KEY_VIDEO_HERO_CURSOS))) return null
    return await firmarUrlR2(KEY_VIDEO_HERO_CURSOS)
  } catch (err) {
    console.error('No se pudo firmar el video del hero de /cursos:', err instanceof Error ? err.message : err)
    return null
  }
}

const PASOS = [
  {
    icono: BookOpen,
    titulo: 'Elias arma el programa',
    texto: 'Módulos y lecciones organizados, con lecturas, infografías, ejercicios y material de apoyo.',
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

const FORMATOS = [
  {
    icono: PlayCircle,
    etiqueta: 'A tu ritmo',
    titulo: 'Cursos grabados',
    filas: [
      {
        pregunta: 'Qué es',
        respuesta:
          'Un curso armado en lecciones, listo para empezar cuando quieras. No hay clases en vivo ni fechas de inscripción: entrás con tu usuario y retomás donde quedaste.',
      },
      {
        pregunta: 'Qué incluye',
        respuesta:
          'Lecturas, infografías, ejercicios de práctica y un quiz de comprensión en cada lección: con el 70% pasás a la siguiente.',
      },
      {
        pregunta: 'Cuánto dura',
        respuesta:
          'Lo definís vos. Cada curso tiene 6 lecciones, y cada una lleva entre 20 minutos y 2 horas y media, según el curso.',
      },
    ],
    enlace: null,
  },
  {
    icono: Presentation,
    etiqueta: 'En grupo',
    titulo: 'Formaciones con cursada',
    filas: [
      {
        pregunta: 'Qué es',
        respuesta:
          'Un programa estructurado que se cursa junto a un grupo, con fecha de inicio y un cronograma definido.',
      },
      {
        pregunta: 'Qué incluye',
        respuesta:
          'Encuentros en vivo, presenciales o virtuales, con espacio para preguntar e intercambiar, y el material de cada módulo.',
      },
      {
        pregunta: 'Cuánto dura',
        respuesta: 'Unas 8 semanas, con encuentros en las fechas que fija el grupo.',
      },
    ],
    enlace: { href: '/formaciones', texto: 'Cómo funcionan las formaciones' },
  },
]

type FilaPrograma = {
  id: string
  titulo: string
  descripcion: string | null
  descripcion_larga: string | null
  portada_key: string | null
  tipo?: string
}

type ProgramaPublico = Omit<FilaPrograma, 'portada_key' | 'tipo'> & { portada_url: string | null }

// Un grupo del listado: título, bajada y el acordeón con la ficha de cada programa. El
// `interes` es el que viaja al formulario de Consultas, para que quien pregunta por una
// formación no quede anotado como interesado en un curso.
function ListaProgramas({
  titulo,
  bajada,
  programas,
  interes,
}: {
  titulo: string
  bajada: string
  programas: ProgramaPublico[]
  interes: 'curso' | 'formacion'
}) {
  return (
    <div>
      <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-3 tracking-tight">{titulo}</h2>
      <p className="font-serif text-tinta/75 text-base leading-relaxed mb-10 max-w-2xl">{bajada}</p>
      <Accordion className="w-full space-y-4">
        {programas.map((p) => (
          <AccordionItem
            key={p.id}
            value={p.id}
            className="border border-border rounded-xl px-4 bg-card data-[state=open]:shadow-md transition-all"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-4 text-left">
                {/* 3:4 exacto, igual que las portadas (707×942): con un cuadrado, object-cover recortaba la
                    banda de arriba y el título de abajo. */}
                <div className="w-12 h-16 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
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
                  <img src={p.portada_url} alt={p.titulo} className="w-full max-w-[220px] aspect-[3/4] object-cover rounded-xl border border-border" />
                ) : (
                  <div className="w-full max-w-[220px] aspect-[3/4] rounded-xl border border-dashed border-border bg-muted flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <DescripcionPrograma
                    texto={p.descripcion_larga || p.descripcion || 'Muy pronto vamos a sumar más detalle sobre este curso.'}
                  />
                  <Link
                    href={`/?interes=${interes}#contacto`}
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
  )
}

export default async function CursosPage() {
  const supabase = await createClient()
  const COLUMNAS_PUBLICAS = 'id, titulo, descripcion, descripcion_larga, portada_key'
  const consultar = async (columnas: string) => {
    const { data, error } = await supabase
      .from('programas')
      .select(columnas)
      .eq('publicado_en_home', true)
      .order('created_at', { ascending: false })
      .returns<FilaPrograma[]>()
    return { programas: data ?? [], error }
  }

  // `tipo` permite agrupar el listado, pero anon no tiene permiso de lectura sobre esa
  // columna hasta que se corra supabase/snippets/2026-10-06-programas-tipo-anon.sql. Hasta
  // entonces el pedido completo falla ("permission denied"), así que se reintenta sin ella
  // y la página muestra un solo listado en vez de quedarse sin programas.
  const conTipo = await consultar(`${COLUMNAS_PUBLICAS}, tipo`)
  const { programas } = conTipo.error ? await consultar(COLUMNAS_PUBLICAS) : conTipo

  const [programasPublicados, videoHeroUrl] = await Promise.all([
    Promise.all(
      programas.map(async (p) => ({ ...p, portada_url: await resolverUrlRecurso(p.portada_key) })),
    ),
    firmarVideoHeroCursos(),
  ])

  // Sin `tipo` (ver arriba) no se sabe qué es qué: un solo listado, sin títulos de grupo que
  // podrían mentir.
  const agrupar = !conTipo.error
  const cursosGrabados = programasPublicados.filter((p) => p.tipo !== 'formacion')
  const formaciones = programasPublicados.filter((p) => p.tipo === 'formacion')

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
          {videoHeroUrl ? (
            <figure className="overflow-hidden rounded-2xl border border-border bg-card">
              <video
                src={`${videoHeroUrl}#t=0.001`}
                poster="/hero-cursos-poster.jpg"
                controls
                playsInline
                preload="metadata"
                className="block aspect-[4/3] w-full bg-tinta object-cover"
              />
              <figcaption className="border-t border-border px-4 py-2.5 font-sans text-sm text-tinta/75">
                Lección grabada
              </figcaption>
            </figure>
          ) : (
            <IlustracionSitio
              slug="cursos-leccion-grabada"
              icon={PlayCircle}
              etiqueta="Lección grabada"
              variante="marca"
              prioridad
            />
          )}
        </div>
      </section>

      {/* DOS FORMATOS — antes eran dos bloques que se pisaban ("Abiertos a todo público" con
          una frase sobre cursos grabados y cursadas en vivo, y "¿Qué es un curso
          asincrónico?" repitiendo la mitad). Además la lista de abajo mezcla los dos tipos de
          programa, así que quien llegaba leyendo "no hay clases en vivo ni fechas" se
          encontraba con una cursada de 8 semanas. Acá se dice una sola vez qué es cada
          formato, lado a lado y con las mismas tres preguntas, y la lista se agrupa igual. */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-3 tracking-tight">
            Dos formas de cursar
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl mb-10">
            Todos los programas están abiertos a todo público: no hace falta ser psicólogo
            ni tener formación previa. Lo que cambia es cómo se cursan.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {FORMATOS.map(({ icono: Icono, etiqueta, titulo, filas, enlace }) => (
              <div key={titulo} className="flex flex-col rounded-2xl border border-border bg-card p-7">
                <div className="mb-5 flex items-center gap-3">
                  <Icono className="h-6 w-6 text-marca" strokeWidth={1.5} aria-hidden />
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-marca">{etiqueta}</p>
                </div>
                <h3 className="font-heading font-semibold text-tinta text-xl mb-5 tracking-tight">{titulo}</h3>
                <dl className="space-y-4">
                  {filas.map(({ pregunta, respuesta }) => (
                    <div key={pregunta}>
                      <dt className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        {pregunta}
                      </dt>
                      <dd className="font-serif text-tinta/80 text-base leading-relaxed">{respuesta}</dd>
                    </div>
                  ))}
                </dl>
                {enlace && (
                  <Link
                    href={enlace.href}
                    className="mt-6 inline-flex items-center gap-2 self-start font-sans text-sm font-medium text-tinta underline underline-offset-4 decoration-tinta/30 transition-colors hover:text-marca hover:decoration-marca"
                  >
                    {enlace.texto} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-10 tracking-tight">
            Cómo funciona un curso grabado
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

      {/* PROGRAMAS DISPONIBLES — programas reales marcados con publicado_en_home, agrupados
          por tipo para que cada uno quede bajo el formato que le corresponde. Un grupo sin
          programas no se dibuja, y la sección entera se oculta si no hay ninguno: un
          acordeón vacío en medio de una página informativa se vería roto. */}
      {programasPublicados.length > 0 && (
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
            {!agrupar && (
              <ListaProgramas
                titulo="Programas disponibles"
                bajada="Elegí uno para ver de qué se trata."
                programas={programasPublicados}
                interes="curso"
              />
            )}
            {agrupar && cursosGrabados.length > 0 && (
              <ListaProgramas
                titulo="Cursos grabados"
                bajada="A tu ritmo y sin fechas. Elegí un curso para ver de qué se trata."
                programas={cursosGrabados}
                interes="curso"
              />
            )}
            {agrupar && formaciones.length > 0 && (
              <ListaProgramas
                titulo="Formaciones en grupo"
                bajada="Cursadas con fecha de inicio y encuentros en vivo. Los grupos y las fechas se coordinan con Elias."
                programas={formaciones}
                interes="formacion"
              />
            )}
          </div>
        </section>
      )}

      {/* PARA QUIÉN ES + imágenes */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <IlustracionSitio
            slug="cursos-para-quien"
            icon={Users}
            etiqueta="Quiénes hacen estos cursos"
            variante="marca"
            className="md:order-2"
          />
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

      {/* ¿SOS PROFESIONAL? — la salida para quien llegó hasta acá siendo del oficio. Iba
          arriba de todo, como un link suelto al lado de "Abiertos a todo público", sin decir
          qué había del otro lado. Acá, al final, explica a quién habla y qué encuentra
          (Supervisiones es la puerta de entrada de todo lo dirigido a profesionales: ver
          SiteHeader). */}
      <section className="bg-marca/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Users className="mt-1 h-7 w-7 shrink-0 text-marca" strokeWidth={1.5} aria-hidden />
            <div>
              <h2 className="font-heading font-semibold text-tinta text-lg tracking-tight">
                ¿Sos profesional de la salud mental?
              </h2>
              <p className="font-serif text-tinta/75 leading-relaxed mt-1.5 max-w-2xl">
                Los cursos de acá sirven para cualquier persona, pero para psicólogos y
                otros profesionales hay un espacio aparte: supervisión de casos, formaciones
                y cursos pensados para tu práctica.
              </p>
            </div>
          </div>
          <Link
            href="/supervisiones"
            className="shrink-0 inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-tinta/20 px-5 py-2.5 font-sans text-sm font-medium text-tinta transition-colors hover:bg-tinta hover:text-crema"
          >
            Ver supervisiones y formaciones <ArrowRight className="w-4 h-4" />
          </Link>
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
