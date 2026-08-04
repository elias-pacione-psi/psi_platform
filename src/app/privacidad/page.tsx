import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'

export const metadata = { title: 'Política de privacidad | Elias Pacione' }

// PLACEHOLDER LEGAL: esta página es solo la infraestructura técnica. Cada bloque
// [ENTRE CORCHETES] debe completarlo el titular del sitio con texto redactado o
// revisado por un abogado (Ley 25.326 y normativa aplicable). No publicar en
// producción con los placeholders visibles.

const secciones = [
  {
    titulo: '1. Responsable del tratamiento',
    contenido: '[COMPLETAR: nombre completo del profesional o razón social, matrícula profesional, domicilio legal y datos de contacto del responsable de esta plataforma.]',
  },
  {
    titulo: '2. Qué datos se recopilan',
    contenido: '[COMPLETAR: detallar los datos que la plataforma efectivamente almacena. Por diseño, se limitan a datos de cuenta (nombre, email, teléfono opcional), el contenido asignado por el profesional y la agenda de sesiones. La plataforma no registra diagnósticos, motivos de consulta ni notas clínicas.]',
  },
  {
    titulo: '3. Finalidad del tratamiento',
    contenido: '[COMPLETAR: describir para qué se usan los datos — p. ej., dar acceso al material asignado y coordinar la agenda de sesiones — y aclarar que no se usan con fines publicitarios ni se comparten con terceros.]',
  },
  {
    titulo: '4. Dónde se almacenan los datos',
    contenido: '[COMPLETAR: indicar el proveedor de infraestructura (p. ej., Supabase y su región de alojamiento), y si existe transferencia internacional de datos, en qué condiciones.]',
  },
  {
    titulo: '5. Derechos del titular de los datos',
    contenido: '[COMPLETAR: explicar cómo ejercer los derechos de acceso, rectificación y supresión previstos por la Ley 25.326, ante quién reclamar y en qué plazos, incluyendo la vía ante la autoridad de aplicación (Agencia de Acceso a la Información Pública).]',
  },
  {
    titulo: '6. Plazo de conservación',
    contenido: '[COMPLETAR: definir cuánto tiempo se conservan la cuenta y sus asignaciones después de finalizado el vínculo profesional, y qué pasa cuando se elimina definitivamente un usuario.]',
  },
  {
    titulo: '7. Consentimiento',
    contenido: '[COMPLETAR: describir cómo se registra el consentimiento informado del alumno para el uso de la plataforma — p. ej., firmado en papel en el consultorio o aceptado al activar la cuenta — según lo defina el profesional con su asesoría legal.]',
  },
  {
    titulo: '8. Seguridad',
    contenido: '[COMPLETAR: resumir las medidas técnicas — sesiones autenticadas, reglas de acceso por fila en la base de datos, archivos servidos con enlaces firmados temporales — sin prometer garantías absolutas.]',
  },
  {
    titulo: '9. Compra de ebooks',
    contenido: '[COMPLETAR: al comprar un ebook se guarda el email de la compra, el ebook elegido, el precio pagado y una referencia de la operación con el procesador de pagos (Mercado Pago u otro que se defina) — nunca el número de tarjeta ni datos de la tarjeta en sí, que el procesador de pago maneja directamente. Detallar acá qué datos ve el procesador de pago, si se emite factura y quién la emite, y que la compra no requiere crear una cuenta (el registro es opcional, posterior al pago).]',
  },
]

export default function PrivacidadPage() {
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
        <h1 className="text-4xl font-heading font-semibold text-tinta mb-3">Política de privacidad</h1>
        <p className="text-tinta/70 mb-8">
          Cómo esta plataforma trata los datos personales de sus usuarios.
        </p>

        <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-10 text-amber-900 dark:text-amber-300">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Borrador pendiente de revisión legal.</strong> Este texto es una estructura
            provisoria: cada sección debe ser completada y revisada por un abogado antes de
            publicar la plataforma. No constituye una política de privacidad vigente.
          </p>
        </div>

        <div className="space-y-8">
          {secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-2xl font-heading font-semibold text-tinta mb-2">{s.titulo}</h2>
              <p className="text-tinta/80 leading-relaxed bg-card border border-tinta/10 rounded-xl p-4 italic">
                {s.contenido}
              </p>
            </section>
          ))}
        </div>

        <p className="text-sm text-tinta/50 mt-12">
          Última actualización: [COMPLETAR al publicar la versión definitiva].
        </p>
      </article>

      <footer className="bg-noche text-nieve/60 py-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Elias Pacione. Plataforma privada de material para alumnos.
      </footer>
    </main>
  )
}
