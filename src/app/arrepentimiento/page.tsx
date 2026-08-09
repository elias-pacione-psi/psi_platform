import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { DATOS_TITULAR, ULTIMA_ACTUALIZACION_LEGAL } from '@/utils/datos-titular'

export const metadata = { title: 'Botón de arrepentimiento | Elias Pacione' }

// La Resolución 424/2020 (Secretaría de Comercio Interior) exige que todo sitio de
// comercio electrónico que venda a consumidores en Argentina tenga un "Botón de
// Arrepentimiento" accesible de forma fácil y directa desde la página de inicio.
// Esta página es ese destino, y por eso:
//   - No pide registrarse ni iniciar sesión (la Resolución lo prohíbe expresamente).
//   - No hay ningún paso previo: alcanza con escribir un mail.
//   - Se compromete el acuse dentro de las 24 hs con un código de identificación,
//     que es el plazo que la Resolución fija.

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
        <p className="text-tinta/70 mb-10 font-serif">
          Cómo dar de baja una compra dentro del plazo legal, sin vueltas.
        </p>

        <div className="space-y-6 text-tinta/80 leading-relaxed">
          <p>
            Como consumidor, la Ley 24.240 (artículo 34) te da derecho a arrepentirte de
            cualquier compra hecha por esta web dentro de los{' '}
            <strong>10 (diez) días corridos</strong> desde que la hiciste o desde que
            recibiste el producto, lo que ocurra después, sin tener que dar ninguna razón
            y sin costo alguno.
          </p>
          <p>
            Vale también si ya descargaste el archivo. No hace falta que te registres, ni
            que completes ningún formulario, ni que expliques por qué: alcanza con un
            mail.
          </p>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-heading font-semibold text-tinta text-lg mb-4">Qué escribir</h2>
            <ul className="space-y-2">
              {[
                'Tu nombre y apellido.',
                'El correo electrónico con el que hiciste la compra.',
                'Qué producto querés dar de baja.',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="text-marca shrink-0 select-none">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={`mailto:${DATOS_TITULAR.email}?subject=${encodeURIComponent('Arrepentimiento de compra')}`}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-6 hover:border-marca/40 transition-colors group"
          >
            <Mail className="w-6 h-6 text-marca shrink-0" />
            <div>
              <p className="font-semibold text-tinta group-hover:text-marca transition-colors break-all">
                {DATOS_TITULAR.email}
              </p>
              <p className="text-sm text-tinta/60">Tocá para escribir el pedido.</p>
            </div>
          </a>

          <div>
            <h2 className="font-heading font-semibold text-tinta text-lg mb-2">Qué pasa después</h2>
            <p>
              Dentro de las <strong>24 horas</strong> vas a recibir la confirmación de que
              el pedido se recibió, junto con un código de identificación del trámite. El
              reintegro se hace por el mismo medio de pago que usaste, sin gastos a tu
              cargo, y se procesa dentro de los 5 días hábiles — el tiempo en que el dinero
              se acredita depende además de tu banco.
            </p>
          </div>

          <p className="text-sm text-tinta/60 pt-4 border-t border-tinta/10">
            El detalle completo está en los{' '}
            <Link href="/terminos" className="text-marca underline underline-offset-2">
              términos y condiciones
            </Link>
            . Si tenés cualquier duda antes de decidir, también podés escribir a esa misma
            dirección.
          </p>
        </div>

        <p className="text-sm text-tinta/50 mt-12 pt-6 border-t border-tinta/10">
          Última actualización: {ULTIMA_ACTUALIZACION_LEGAL}.
        </p>
      </article>

      <footer className="bg-noche text-nieve/60 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Elias Pacione.
      </footer>
    </main>
  )
}
