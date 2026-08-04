import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'

export const metadata = { title: 'Términos y condiciones | Elias Pacione' }

// PLACEHOLDER LEGAL: mismo criterio que /privacidad/page.tsx — esta página es la
// infraestructura técnica para vender ebooks online (Res. 424/2020 exige términos claros
// y derecho de arrepentimiento visibles). Cada bloque [ENTRE CORCHETES] necesita datos
// reales del titular del sitio (razón social, CUIT, domicilio) que este código no tiene
// ni puede inventar. El texto de la Ley 24.240 (arrepentimiento) SÍ está redactado
// completo porque es la norma pública, no un dato del negocio — pero conviene que un
// abogado lo revise antes de publicar igual, por si aplica algún matiz local.

const secciones = [
  {
    titulo: '1. Quién vende',
    contenido: '[COMPLETAR: nombre completo o razón social del vendedor, CUIT, domicilio legal, email y teléfono de contacto. La Res. 424/2020 exige que estos datos estén visibles antes de la compra.]',
  },
  {
    titulo: '2. Qué se vende',
    contenido: 'Los ebooks publicados en /ebooks: contenido digital (PDF) de acceso inmediato tras acreditarse el pago. Los precios se muestran en pesos argentinos (ARS) e incluyen los impuestos aplicables. El precio vigente es el que figura en la página del producto al momento de la compra; una vez pagado, ese precio queda fijo aunque el ebook suba de valor después.',
  },
  {
    titulo: '3. Cómo se paga',
    contenido: '[COMPLETAR: medios de pago habilitados una vez configurado el proveedor — p. ej. Mercado Pago: tarjetas, transferencia, dinero en cuenta. Aclarar si se emite factura y de qué tipo (monotributo, factura A/B).]',
  },
  {
    titulo: '4. Cómo se entrega',
    contenido: 'La entrega es digital e inmediata: acreditado el pago, se habilita un enlace de descarga del PDF enviado al email de la compra. No hay envío físico ni costo de envío.',
  },
  {
    titulo: '5. Derecho de arrepentimiento (Ley 24.240, art. 34)',
    contenido: 'Como consumidor, tenés derecho a arrepentirte de la compra dentro de los 10 (diez) días corridos desde que se perfeccionó el contrato (el momento del pago) o desde que recibiste el producto, lo que sea posterior, sin tener que dar ninguna razón y sin costo alguno. Podés ejercerlo por el mismo medio que usaste para comprar, o desde la página de Arrepentimiento. Al tratarse de un contenido digital que se entrega mediante descarga inmediata, si ya descargaste el archivo antes de arrepentirte, el reintegro puede evaluarse caso por caso — [COMPLETAR: definir con asesoría legal si corresponde pedir consentimiento expreso a la entrega inmediata como excepción a este derecho, tal como prevé la normativa de contenido digital, y cómo se deja registrado ese consentimiento en el checkout].',
  },
  {
    titulo: '6. Reembolsos',
    contenido: '[COMPLETAR: plazo y medio en que se hacen efectivos los reembolsos una vez aceptado el arrepentimiento o detectado un error de cobro.]',
  },
  {
    titulo: '7. Propiedad intelectual',
    contenido: 'El contenido de los ebooks es propiedad de Elias Pacione. La compra da derecho a un uso personal: no se puede redistribuir, revender ni publicar el archivo.',
  },
  {
    titulo: '8. Ley aplicable y jurisdicción',
    contenido: '[COMPLETAR: ley aplicable (probablemente Ley 24.240 de Defensa del Consumidor y Código Civil y Comercial de la Nación) y jurisdicción competente en caso de conflicto.]',
  },
]

export default function TerminosPage() {
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
        <h1 className="text-4xl font-heading font-semibold text-tinta mb-3">Términos y condiciones</h1>
        <p className="text-tinta/70 mb-8">
          Condiciones de compra de los ebooks disponibles en esta web.
        </p>

        <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-10 text-amber-900 dark:text-amber-300">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Borrador pendiente de revisión legal.</strong> Los bloques marcados
            [COMPLETAR] necesitan datos reales del negocio (razón social, CUIT, medios de
            pago) y revisión de un abogado antes de publicar. No constituye términos y
            condiciones vigentes.
          </p>
        </div>

        <div className="space-y-8">
          {secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-2xl font-heading font-semibold text-tinta mb-2">{s.titulo}</h2>
              <p className={`text-tinta/80 leading-relaxed rounded-xl p-4 ${
                s.contenido.startsWith('[COMPLETAR')
                  ? 'bg-card border border-tinta/10 italic'
                  : 'bg-card border border-tinta/10'
              }`}>
                {s.contenido}
              </p>
            </section>
          ))}
        </div>

        <p className="text-sm text-tinta/50 mt-12">
          Última actualización: [COMPLETAR al publicar la versión definitiva].
        </p>
      </article>
    </main>
  )
}
