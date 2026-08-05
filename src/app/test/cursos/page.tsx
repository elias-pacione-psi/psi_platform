import Link from 'next/link'
import { PlayCircle, BookOpen, ClipboardCheck, ArrowRight, Clock } from 'lucide-react'
import { AvisoPreview } from '../_components/AvisoPreview'
import { ImagenMuestra } from '../_components/ImagenMuestra'

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

export default function TestCursosPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <AvisoPreview servicioActual="Cursos" />

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
