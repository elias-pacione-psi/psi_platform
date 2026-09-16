import Link from 'next/link'
import { MessagesSquare, GraduationCap, CalendarCheck, ArrowRight, Users, Presentation, BookOpen, BadgeCheck } from 'lucide-react'
import { IlustracionSitio } from '@/components/IlustracionSitio'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata = { title: 'Supervisiones | Elias Pacione' }

// Ver formaciones/page.tsx: se regenera cada hora para que la firma de R2 no venza.
export const revalidate = 3600

const PASOS = [
  {
    icono: MessagesSquare,
    titulo: 'Primer encuentro',
    texto: 'Coordinamos una charla inicial para entender qué necesitás revisar de tu práctica.',
  },
  {
    icono: Users,
    titulo: 'Se define la modalidad',
    texto: 'Individual o grupal, con la frecuencia que mejor se acomode a tu momento.',
  },
  {
    icono: CalendarCheck,
    titulo: 'Encuentros periódicos',
    texto: 'Se coordinan por fuera de la plataforma, con la agenda de Elias.',
  },
]

export default function SupervisionesPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-4">
              Supervisión
            </p>
            <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-5 leading-[1.15] tracking-tight">
              Un espacio para pensar tu práctica con otro
            </h1>
            <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-8">
              Un lugar para revisar casos, dudas técnicas y tu propio proceso
              profesional, acompañado por alguien con más recorrido.
            </p>
            <Link
              href="/?interes=supervision#contacto"
              className="inline-flex items-center gap-2 bg-tinta text-crema px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca"
            >
              Quiero más información <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <IlustracionSitio
            slug="supervisiones-charla"
            icon={MessagesSquare}
            etiqueta="Charla de supervisión"
            variante="marca"
          />
        </div>
      </section>

      {/* PARA QUIÉN ES — espejo del bloque de /cursos. La minuta pedía que esta sección
          quedara marcada como la de profesionales, con su explicación aparte: es la puerta
          de entrada de todo lo dirigido a colegas (supervisión, formaciones y cursos
          dedicados), frente a /cursos que es la oferta de público general. */}
      <section className="bg-marca/5 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <BadgeCheck className="mt-1 h-7 w-7 shrink-0 text-marca" strokeWidth={1.5} aria-hidden />
            <div>
              <h2 className="font-heading font-semibold text-tinta text-lg tracking-tight">
                Un espacio para profesionales
              </h2>
              <p className="font-serif text-tinta/75 leading-relaxed mt-1.5 max-w-2xl">
                Esta sección es para psicólogos en ejercicio y estudiantes avanzados. Además
                de la supervisión de casos, acá están las <strong className="font-sans font-semibold text-tinta">formaciones
                y los cursos dedicados a colegas</strong>, distintos de los cursos de público general.
              </p>
            </div>
          </div>
          <Link
            href="/cursos"
            className="shrink-0 inline-flex items-center gap-2 self-start md:self-auto rounded-full border border-tinta/20 px-5 py-2.5 font-sans text-sm font-medium text-tinta transition-colors hover:bg-tinta hover:text-crema"
          >
            ¿Buscás cursos abiertos? <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
            ¿Qué es un espacio de supervisión?
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl">
            Es un espacio de trabajo entre colegas: sirve para pensar en conjunto los
            casos que te generan dudas, revisar decisiones clínicas y sostener tu
            propio proceso como profesional. No reemplaza tu formación de base — la
            complementa con la mirada de alguien externo a tu día a día.
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

      {/* PARA QUIÉN ES + imágenes */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <IlustracionSitio
            slug="supervisiones-colegas"
            icon={GraduationCap}
            etiqueta="Encuentro entre colegas"
            variante="sage"
            className="md:order-2"
          />
          <div className="md:order-1">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
              ¿Para quién es?
            </h2>
            <ul className="font-serif text-tinta/75 text-base leading-relaxed space-y-3">
              <li>· Para psicólogos en ejercicio que quieren revisar casos con otra mirada.</li>
              <li>· Para estudiantes avanzados que están empezando sus primeras prácticas.</li>
              <li>· Para equipos que buscan un espacio de supervisión sostenido en el tiempo.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FORMACIÓN PARA PROFESIONALES — Formaciones salió de la barra de navegación y
          pasó a vivir acá (minuta del psicólogo). La página /formaciones sigue existiendo
          con el detalle completo; esto es la puerta de entrada. */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            Formación para profesionales
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl mb-10">
            Más allá de la supervisión de casos, hay dos caminos para seguir formándote.
            Ninguno se compra online: se coordinan con Elias después de una consulta.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-7 flex flex-col">
              <Presentation className="w-7 h-7 text-marca mb-4" strokeWidth={1.5} aria-hidden />
              <h3 className="font-heading font-semibold text-tinta text-lg mb-2 tracking-tight">
                Formaciones con clases en vivo
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed grow">
                Un recorrido en grupo con fechas fijas, clases en vivo (presenciales o
                virtuales), programa estructurado, devolución personalizada en los trabajos
                y un ebook que acompaña todo el trayecto.
              </p>
              <Link
                href="/formaciones"
                className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-marca hover:underline underline-offset-2"
              >
                Ver cómo funcionan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="bg-card rounded-2xl border border-border p-7 flex flex-col">
              <BookOpen className="w-7 h-7 text-marca mb-4" strokeWidth={1.5} aria-hidden />
              <h3 className="font-heading font-semibold text-tinta text-lg mb-2 tracking-tight">
                Cursos dedicados a colegas
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed grow">
                Cursos puntuales sobre temas de la práctica clínica, pensados para quien ya
                tiene formación de base. Son distintos de los cursos de público general:
                asumen el vocabulario y el recorrido de un profesional.
              </p>
              <Link
                href="/?interes=formacion#contacto"
                className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-marca hover:underline underline-offset-2"
              >
                Consultar por los cursos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-tinta">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-crema text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            ¿Te interesa un espacio de supervisión?
          </h2>
          <p className="font-serif text-crema/75 text-base leading-relaxed mb-8">
            La coordinación es por fuera de la plataforma: contanos tu situación y
            Elias te escribe para conversarlo.
          </p>
          <Link
            href="/?interes=supervision#contacto"
            className="inline-flex items-center gap-2 bg-crema text-tinta px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca hover:text-crema"
          >
            Quiero más información <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
