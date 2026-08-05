import Link from 'next/link'
import { HeartHandshake, UserRound, MessageCircleHeart, ArrowRight, ShieldCheck } from 'lucide-react'
import { ImagenMuestra } from '@/components/ImagenMuestra'

export const metadata = { title: 'Terapia individual | Elias Pacione' }

const PASOS = [
  {
    icono: MessageCircleHeart,
    titulo: 'Primera consulta',
    texto: 'Nos conocemos y charlamos sobre qué te trae a buscar este espacio.',
  },
  {
    icono: UserRound,
    titulo: 'Definimos la modalidad',
    texto: 'Presencial o virtual, con la frecuencia que mejor te acomode.',
  },
  {
    icono: HeartHandshake,
    titulo: 'Sesiones con continuidad',
    texto: 'Encuentros periódicos, en un espacio pensado para vos.',
  },
]

export default function TerapiaIndividualPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
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
              Terapia individual
            </p>
            <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-5 leading-[1.15] tracking-tight">
              Un espacio propio para tu proceso
            </h1>
            <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-8">
              Acompañamiento psicológico individual, presencial o virtual, en un
              espacio confidencial pensado a tu ritmo.
            </p>
            <Link
              href="/?interes=terapia_individual#contacto"
              className="inline-flex items-center gap-2 bg-tinta text-crema px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca"
            >
              Quiero más información <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <ImagenMuestra icon={HeartHandshake} etiqueta="Encuentro terapéutico" variante="marca" />
        </div>
      </section>

      {/* QUÉ ES */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
            ¿Qué es la terapia individual?
          </h2>
          <p className="font-serif text-tinta/75 text-base leading-relaxed max-w-2xl">
            Es un espacio de encuentro, uno a uno, para acompañarte en lo que estés
            atravesando — con escucha, contención y un vínculo de confianza. No hay una
            fórmula única: la frecuencia y la modalidad se piensan juntos, según tu
            momento y tus tiempos.
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

      {/* PRIVACIDAD + imágenes */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <ImagenMuestra icon={UserRound} etiqueta="Espacio individual" variante="sage" className="md:order-2" />
          <div className="md:order-1">
            <h2 className="text-tinta text-2xl md:text-3xl font-heading font-semibold mb-5 tracking-tight">
              Un espacio confidencial
            </h2>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-marca shrink-0 mt-1" strokeWidth={1.5} />
              <p className="font-serif text-tinta/75 text-base leading-relaxed">
                Lo que se conversa en sesión queda entre vos y Elias. Nada de tu proceso
                se publica ni se comparte con nadie.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-tinta">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-crema text-2xl md:text-3xl font-heading font-semibold mb-4 tracking-tight">
            ¿Querés empezar tu proceso?
          </h2>
          <p className="font-serif text-crema/75 text-base leading-relaxed mb-8">
            Contanos brevemente qué te trae por acá y Elias te escribe para coordinar
            una primera consulta.
          </p>
          <Link
            href="/?interes=terapia_individual#contacto"
            className="inline-flex items-center gap-2 bg-crema text-tinta px-8 py-3.5 rounded-full font-medium text-base transition-colors hover:bg-marca hover:text-crema"
          >
            Quiero más información <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}
