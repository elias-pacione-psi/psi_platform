import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FotoElias } from '@/components/FotoElias'
import { GaleriaFotos } from '@/components/GaleriaFotos'
import { SiteHeader } from '@/components/SiteHeader'
import { listarGaleriaQuienSoy } from '@/utils/galeria-quien-soy'
import {
  ANIO_TITULO,
  CITA,
  COLEGIATURA,
  DATOS_RAPIDOS,
  ENFOQUES,
  ENFOQUE_PRINCIPAL,
  ESPECIALIDADES,
  aniosDeEjercicio,
} from '@/utils/perfil-profesional'

export const metadata = {
  title: 'Quién soy | Elias Pacione',
  description:
    'Licenciado en Psicología desde 2014, especializado en terapia cognitivo-conductual. Trayectoria, enfoques, áreas de trabajo y fotos de charlas, seminarios y encuentros.',
}

// Se regenera cada hora por la galería: las fotos se sirven con URL firmada de R2 (ver
// utils/galeria-quien-soy.ts) y la firma vence, igual que las ilustraciones de formaciones.
// De paso, una foto o un álbum nuevo aparece solo, sin deploy.
export const revalidate = 3600

const CHIP = 'bg-crema dark:bg-background text-tinta/80 text-xs px-3 py-1.5 rounded-full border border-border'

export default async function QuienSoyPage() {
  const albumes = await listarGaleriaQuienSoy()
  const anios = aniosDeEjercicio()
  const otrosEnfoques = ENFOQUES.filter((e) => e !== ENFOQUE_PRINCIPAL)

  const hitos = [
    { valor: String(ANIO_TITULO), texto: 'Se recibió de Licenciado en Psicología' },
    { valor: `+${anios}`, texto: 'años de ejercicio profesional' },
    { valor: 'TCC', texto: 'Terapia cognitivo-conductual, su enfoque de especialidad' },
  ]

  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <SiteHeader />

      {/* PRESENTACIÓN */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-16 grid grid-cols-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.55fr)] gap-12 items-center">
          <FotoElias />

          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-4">
              Quién soy
            </p>
            <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-5 leading-[1.15] tracking-tight">
              Elias Pacione
            </h1>
            <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-4">
              Licenciado en Psicología, con más de {anios} años de trayectoria acompañando
              procesos de adolescentes, adultos y parejas, en modalidad presencial y
              virtual.
            </p>
            <p className="font-serif text-tinta/75 text-base leading-relaxed mb-5">
              Se formó con una mirada ecléctica: su especialidad es la terapia
              cognitivo-conductual, y la integra con herramientas de otros enfoques según
              lo que cada proceso necesita, en vez de encajar a la persona en un único
              método.
            </p>
            <p className="font-serif italic text-tinta/60 text-sm leading-relaxed border-l-2 border-marca pl-4 mb-5">
              &ldquo;{CITA}&rdquo;
            </p>
            <p className="text-xs text-muted-foreground mb-8">{COLEGIATURA}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/?interes=terapia_individual#contacto"
                className="inline-flex items-center gap-2 bg-tinta text-crema px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca"
              >
                Escribirle a Elias <ArrowRight className="w-4 h-4" />
              </Link>
              {albumes.length > 0 && (
                <Link
                  href="#galeria"
                  className="inline-flex items-center rounded-full border border-tinta/20 px-6 py-3.5 font-medium text-base text-tinta transition-colors hover:bg-tinta hover:text-crema"
                >
                  Ver fotos
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRAYECTORIA EN BREVE */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {hitos.map(({ valor, texto }) => (
              <div key={valor} className="flex items-baseline gap-4 sm:block">
                <dt className="w-28 shrink-0 font-heading font-semibold text-marca text-4xl tracking-tight sm:mb-2 sm:w-auto">{valor}</dt>
                <dd className="font-serif text-tinta/75 text-sm leading-relaxed">{texto}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CÓMO TRABAJA */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
              Cómo trabaja
            </h2>
            <p className="font-serif text-tinta/75 text-base leading-relaxed mb-4">
              Propone un espacio de diálogo y reflexión, con cordialidad y empatía, donde
              cada persona pueda expresarse y buscar soluciones junto a él, con
              herramientas técnicas.
            </p>
            <p className="font-serif text-tinta/75 text-base leading-relaxed mb-6">
              En la primera sesión explora qué te llevó a buscar terapia y, a partir de
              eso, definen juntos los enfoques que mejor te acompañan.
            </p>

            <h3 className="font-heading font-semibold text-tinta text-sm uppercase tracking-[0.14em] mb-3">
              Enfoques terapéuticos
            </h3>
            <ul className="flex flex-wrap gap-2">
              <li className="bg-tinta text-crema text-xs px-3 py-1.5 rounded-full border border-tinta">
                {ENFOQUE_PRINCIPAL} · especialidad
              </li>
              {otrosEnfoques.map((item) => (
                <li key={item} className={CHIP}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
              Áreas de trabajo
            </h2>
            <p className="font-serif text-tinta/75 text-base leading-relaxed mb-6">
              Los temas con los que acompaña habitualmente en el consultorio.
            </p>
            <ul className="flex flex-wrap gap-2">
              {ESPECIALIDADES.map((item) => (
                <li key={item} className={CHIP}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PSICOLOGÍA Y FE */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
              También desde la fe
            </h2>
            <p className="font-serif text-tinta/75 text-base leading-relaxed">
              Acompaña a personas de la comunidad cristiana: la terapia cristiana es uno
              de los enfoques que integra y la espiritualidad, uno de los temas con los
              que trabaja. Ese cruce entre salud mental y vida espiritual es el eje de
              Psicología y Fe.
            </p>
          </div>
          <Link
            href="/psicologia-y-fe"
            className="shrink-0 inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-tinta/20 px-5 py-2.5 font-sans text-sm font-medium text-tinta transition-colors hover:bg-tinta hover:text-crema"
          >
            Conocer Psicología y Fe <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* DÓNDE Y CÓMO ATIENDE */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            Dónde y cómo atiende
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl mb-8">
            Atiende presencialmente en Wilde y Quilmes (Buenos Aires), además de sesiones
            virtuales para quienes están en otra ciudad o prefieren esa modalidad.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DATOS_RAPIDOS.map(({ icono: Icono, titulo, texto }) => (
              <div
                key={titulo}
                className="flex items-start gap-3 bg-card border border-border rounded-xl p-4"
              >
                <Icono className="w-4 h-4 text-marca shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{titulo}</p>
                  <p className="font-serif text-sm text-tinta/80 leading-snug">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALERÍA — sólo si hay fotos: una sección vacía en una página pública es peor que
          ninguna. Se arma sola desde la carpeta del bucket (ver galeria-quien-soy.ts). */}
      {albumes.length > 0 && (
        <section id="galeria" className="border-b border-border scroll-mt-24">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-3 tracking-tight">
              Charlas, seminarios y encuentros
            </h2>
            <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl mb-10">
              Algunos momentos de los espacios que Elias comparte con su comunidad.
            </p>
            <GaleriaFotos albumes={albumes} />
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="bg-tinta">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-crema text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            ¿Querés conocer más?
          </h2>
          <p className="font-serif text-crema/75 text-base leading-relaxed mb-8">
            Contanos qué te interesa y Elias te escribe: una primera consulta, un curso,
            una supervisión o una formación.
          </p>
          <Link
            href="/#contacto"
            className="inline-flex items-center gap-2 bg-crema text-tinta px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca hover:text-crema"
          >
            Quiero más información <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
