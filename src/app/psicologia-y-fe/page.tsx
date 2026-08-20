import Link from 'next/link'
import { BookOpen, Users, MessageSquareQuote, ShieldCheck, ArrowRight, HeartHandshake, Sparkles, UserCheck } from 'lucide-react'
import { IlustracionSitio } from '@/components/IlustracionSitio'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata = { title: 'Psicología y Fe | Elias Pacione' }

// Ver formaciones/page.tsx: se regenera cada hora para que la firma de R2 no venza.
export const revalidate = 3600

const SERVICIOS = [
  {
    icono: Users,
    titulo: 'Charlas presenciales',
    subtitulo: 'Salud mental y fe en comunidad',
    texto: 'Talleres, jornadas y encuentros grupales o presenciales enfocados en la educación emocional, la prevención y el abordaje de la salud mental desde una perspectiva integral.',
  },
  {
    icono: MessageSquareQuote,
    titulo: 'Consultas pastorales',
    subtitulo: 'Orientación para líderes e iglesias',
    texto: 'Espacio de asesoramiento y contención técnica para pastores y referentes de comunidad en el acompañamiento de casos complejos y cuidado del propio equipo.',
  },
  {
    icono: UserCheck,
    titulo: 'Supervisión a psicólogos cristianos',
    subtitulo: 'Acompañamiento entre profesionales',
    texto: 'Supervisión clínica y ética orientada a profesionales de la psicología que acompañan a consultantes con una cosmovisión de fe o en comunidades cristianas.',
  },
]

export default function PsicologiaYFePage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-4">
              Psicología y Fe
            </p>
            <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-5 leading-[1.15] tracking-tight">
              Psicología aplicada para la comunidad cristiana
            </h1>
            <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-8">
              Un puente profesional y humano entre la salud mental y la vida espiritual,
              brindando herramientas clínicas fundamentadas para personas, líderes y profesionales.
            </p>
            <Link
              href="/?interes=psicologia_fe#contacto"
              className="inline-flex items-center gap-2 bg-tinta text-crema px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca"
            >
              Quiero más información <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <IlustracionSitio
            slug="fe-puente"
            icon={HeartHandshake}
            etiqueta="Psicología y fe integrada"
            variante="marca"
          />
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
            ¿En qué consiste este espacio?
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-3xl">
            Entendemos que la mente, las emociones y la espiritualidad forman parte de una misma
            unidad integral. Este espacio ofrece intervenciones psicológicas rigurosas, éticas y
            respetuosas de los valores de fe, sin confundir el rol del profesional de la salud mental
            con el del acompañamiento pastoral, sino integrándolos armónicamente.
          </p>
        </div>
      </section>

      {/* TRES PILARES / SERVICIOS */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-10">
            <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-2">
              Modalidades de trabajo
            </p>
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold tracking-tight">
              ¿Cómo nos organizamos?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICIOS.map(({ icono: Icono, titulo, subtitulo, texto }, i) => (
              <div key={titulo} className="bg-card rounded-2xl border border-border p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <Icono className="w-7 h-7 text-marca" strokeWidth={1.5} />
                    <span className="font-heading font-semibold text-marca text-sm">{`0${i + 1}`}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-tinta text-lg mb-1 tracking-tight">{titulo}</h3>
                  <p className="text-xs font-medium text-marca mb-3">{subtitulo}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIDENCIALIDAD Y RIGOR */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <IlustracionSitio
            slug="fe-enfoque-profesional"
            icon={BookOpen}
            etiqueta="Enfoque profesional"
            variante="sage"
            className="md:order-2"
          />
          <div className="md:order-1">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
              Rigor clínico y marco ético
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-marca shrink-0 mt-1" strokeWidth={1.5} />
                <p className="font-serif text-tinta/75 text-base leading-relaxed">
                  Todas las actividades y procesos se rigen por el marco ético y la confidencialidad profesional,
                  garantizando un clima seguro para dialogar con libertad sobre dudas, crisis o inquietudes.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-marca shrink-0 mt-1" strokeWidth={1.5} />
                <p className="font-serif text-tinta/75 text-base leading-relaxed">
                  Basado en evidencia científica y herramientas psicológicas validadas, orientadas a potenciar
                  el bienestar personal y comunitario.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-tinta">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-crema text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            ¿Querés coordinar una charla, consulta o supervisión?
          </h2>
          <p className="font-serif text-crema/75 text-base leading-relaxed mb-8">
            Completá el formulario de contacto indicando tu interés y Elias se pondrá en contacto con vos.
          </p>
          <Link
            href="/?interes=psicologia_fe#contacto"
            className="inline-flex items-center gap-2 bg-crema text-tinta px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca hover:text-crema"
          >
            Quiero más información <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
