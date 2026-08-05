import Link from 'next/link'
import { Presentation, Users, CalendarCheck, ArrowRight, BookOpen } from 'lucide-react'
import { AvisoPreview } from '../_components/AvisoPreview'
import { ImagenMuestra } from '../_components/ImagenMuestra'

const PASOS = [
  {
    icono: CalendarCheck,
    titulo: 'Te inscribís en una cohorte',
    texto: 'Cada comisión tiene fecha de inicio y un grupo con el que recorrés la formación.',
  },
  {
    icono: Presentation,
    titulo: 'Asistís a los encuentros en vivo',
    texto: 'Clases presenciales o virtuales, con espacio para preguntar e intercambiar.',
  },
  {
    icono: BookOpen,
    titulo: 'Tenés programa + ebook',
    texto: 'El contenido completo queda disponible junto con un ebook de acompañamiento.',
  },
]

export default function TestFormacionesPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <AvisoPreview servicioActual="Formaciones" />

      <header className="w-full border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-sm text-marca hover:text-tinta transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-4">
              Formación con clases en vivo
            </p>
            <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-5 leading-[1.15] tracking-tight">
              Un recorrido en grupo, con encuentros en vivo
            </h1>
            <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-8">
              Formación por comisiones: clases en vivo con un grupo, programa
              estructurado y un ebook que acompaña todo el recorrido.
            </p>
            <Link
              href="/?interes=formacion#contacto"
              className="inline-flex items-center gap-2 bg-tinta text-crema px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca"
            >
              Quiero más información <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ImagenMuestra icon={Presentation} etiqueta="Clase en vivo" variante="marca" />
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
            ¿Qué es una formación?
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl">
            Es un recorrido junto a un grupo (la cohorte), con clases en vivo —
            presenciales o virtuales— además del programa y la biblioteca de apoyo que
            también tienen los cursos. La diferencia está en el encuentro: hay fechas
            fijas, intercambio con otros y devolución personalizada en los trabajos.
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
          <ImagenMuestra icon={Users} etiqueta="Grupo de la cohorte" variante="sage" className="md:order-2" />
          <div className="md:order-1">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
              ¿Para quién es?
            </h2>
            <ul className="font-serif text-tinta/75 text-base leading-relaxed space-y-3">
              <li>· Para quien aprende mejor con la estructura de fechas fijas.</li>
              <li>· Para quien busca intercambiar con otros que están en lo mismo.</li>
              <li>· Para quien quiere devolución personalizada, no solo material grabado.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-tinta">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-crema text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            ¿Te interesa esta formación?
          </h2>
          <p className="font-serif text-crema/75 text-base leading-relaxed mb-8">
            La inscripción no es online: contanos qué te interesa y Elias te escribe
            con las próximas fechas de comisión.
          </p>
          <Link
            href="/?interes=formacion#contacto"
            className="inline-flex items-center gap-2 bg-crema text-tinta px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca hover:text-crema"
          >
            Quiero más información <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
