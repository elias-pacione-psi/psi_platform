import Link from 'next/link'
import { ArrowLeft, TriangleAlert, Mail } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'

export const metadata = { title: 'Botón de arrepentimiento | Elias Pacione' }

// La Resolución 424/2020 (Secretaría de Comercio Interior) exige que todo sitio de
// comercio electrónico que venda a consumidores en Argentina tenga un "Botón de
// Arrepentimiento" visible en la página de inicio, que lleve a un medio para ejercer el
// derecho de revocación de la Ley 24.240 sin trabas. Esta página es ese destino.
//
// [COMPLETAR: el email de contacto de abajo es un placeholder. Reemplazarlo por la
// casilla real que va a recibir estos pedidos antes de publicar.]
const EMAIL_ARREPENTIMIENTO = '[COMPLETAR: email de contacto]'

export default function ArrepentimientoPage() {
  return (
    <main className="min-h-screen bg-crema font-sans">
      <header className="w-full bg-crema/90 backdrop-blur border-b border-tinta/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-heading font-semibold text-tinta mb-3">Botón de arrepentimiento</h1>
        <p className="text-tinta/70 mb-8">
          Cómo dar de baja una compra dentro del plazo legal.
        </p>

        <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-10 text-amber-900 dark:text-amber-300">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Infraestructura sin datos reales todavía.</strong> El email de contacto
            de esta página es un placeholder — hay que completarlo con la casilla real
            antes de publicar. Ver también los términos y condiciones para el texto legal
            completo del derecho de arrepentimiento.
          </p>
        </div>

        <div className="space-y-6 text-tinta/80 leading-relaxed">
          <p>
            Como consumidor, la Ley 24.240 (artículo 34) te da derecho a arrepentirte de
            cualquier compra hecha por esta web dentro de los <strong>10 (diez) días
            corridos</strong> desde el pago, sin tener que dar ninguna razón y sin costo.
          </p>
          <p>
            Para ejercerlo, escribinos indicando tu nombre, el email con el que compraste
            y el ebook en cuestión. Vamos a confirmar la recepción y procesar la baja por
            el mismo medio con el que se hizo la compra.
          </p>

          <div className="bg-card border border-tinta/10 rounded-xl p-6 flex items-center gap-4">
            <Mail className="w-6 h-6 text-marca shrink-0" />
            <div>
              <p className="font-semibold text-tinta">{EMAIL_ARREPENTIMIENTO}</p>
              <p className="text-sm text-tinta/60">Respondemos a la brevedad.</p>
            </div>
          </div>

          <p className="text-sm text-tinta/60">
            Más detalle en los{' '}
            <Link href="/terminos" className="text-marca underline underline-offset-2">
              términos y condiciones
            </Link>.
          </p>
        </div>
      </article>
    </main>
  )
}
