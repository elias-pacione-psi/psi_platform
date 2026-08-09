import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { DATOS_TITULAR, faltanDatosTitular, ULTIMA_ACTUALIZACION_LEGAL } from '@/utils/datos-titular'

export const metadata = { title: 'Términos y condiciones | Elias Pacione' }

// Redactado sobre la Ley 24.240 (Defensa del Consumidor), la Resolución 424/2020 de
// la Secretaría de Comercio Interior y el Código Civil y Comercial.
//
// Dos decisiones deliberadas, porque es donde más se equivocan los sitios chicos:
//
// 1) El derecho de arrepentimiento se reconoce sin condicionarlo a que el archivo no
//    se haya descargado. El art. 34 de la Ley 24.240 no admite que el proveedor lo
//    recorte, y el art. 37 fulmina como abusiva toda cláusula que desnaturalice las
//    obligaciones o limite la responsabilidad. Diez días corridos, sin peros.
//
// 2) La jurisdicción es la del domicilio del CONSUMIDOR, no la del vendedor. El art.
//    36 in fine la declara improrrogable: una cláusula que fije los tribunales de
//    Quilmes para un comprador de Salta sería nula de nulidad absoluta.
//
// Los datos identificatorios salen de utils/datos-titular.ts.

type Bloque =
  | { tipo: 'p'; texto: string }
  | { tipo: 'lista'; items: string[] }

const secciones: { titulo: string; bloques: Bloque[] }[] = [
  {
    titulo: '1. Quién vende',
    bloques: [
      {
        tipo: 'p',
        texto: `Los productos y servicios ofrecidos en ${DATOS_TITULAR.sitio} son comercializados por ${DATOS_TITULAR.nombre}, ${DATOS_TITULAR.profesion}${DATOS_TITULAR.matricula ? `, ${DATOS_TITULAR.matricula}` : ''}.`,
      },
      {
        tipo: 'lista',
        items: [
          DATOS_TITULAR.cuit ? `CUIT: ${DATOS_TITULAR.cuit}` : '',
          DATOS_TITULAR.domicilio ? `Domicilio: ${DATOS_TITULAR.domicilio}` : '',
          `Email de contacto: ${DATOS_TITULAR.email}`,
          DATOS_TITULAR.telefono ? `Teléfono: ${DATOS_TITULAR.telefono}` : '',
        ].filter(Boolean),
      },
      {
        tipo: 'p',
        texto: 'Al comprar en este sitio aceptás estos términos. Te recomendamos leerlos: están escritos para que se entiendan.',
      },
    ],
  },
  {
    titulo: '2. Qué se compra online y qué no',
    bloques: [
      {
        tipo: 'p',
        texto: 'Lo único que se compra directamente por la web son los ebooks publicados en la sección correspondiente: contenido digital en formato PDF.',
      },
      {
        tipo: 'p',
        texto: 'Los cursos, las formaciones, los espacios de supervisión y la terapia individual NO se contratan online. Para esos servicios el sitio solo ofrece un formulario de consulta: el acceso se acuerda personalmente después de una conversación previa, y es Elías quien habilita la cuenta y asigna el material.',
      },
    ],
  },
  {
    titulo: '3. Precios',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Los precios se muestran en pesos argentinos (ARS) e incluyen los impuestos aplicables.',
          'El precio válido es el que figura publicado en la página del producto en el momento de la compra.',
          'Una vez pagada la compra, ese precio queda firme aunque el producto aumente después.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Si por un error evidente de carga un producto apareciera publicado a un precio manifiestamente equivocado, se te informará antes de procesar la operación y podrás optar por confirmarla al precio correcto o cancelarla con reintegro total.',
      },
    ],
  },
  {
    titulo: '4. Cómo se paga',
    bloques: [
      {
        tipo: 'p',
        texto: 'El pago se realiza a través de la plataforma de pagos habilitada en cada producto, que puede incluir tarjeta de crédito o débito, transferencia bancaria u otros medios que ofrezca el procesador.',
      },
      {
        tipo: 'p',
        texto: 'El cobro lo procesa esa plataforma, no este sitio: los datos de tu tarjeta nunca pasan por acá ni quedan almacenados en esta web. El comprobante fiscal correspondiente se emite conforme a la normativa vigente.',
      },
    ],
  },
  {
    titulo: '5. Cómo se entrega',
    bloques: [
      {
        tipo: 'p',
        texto: 'La entrega es digital. Una vez acreditado el pago se habilita el acceso al archivo mediante un enlace de descarga vinculado al correo electrónico con el que compraste. No hay envío físico ni costo de envío.',
      },
      {
        tipo: 'p',
        texto: 'Si por algún motivo no recibieras el acceso, escribí al email de contacto y se resuelve. La compra queda registrada aunque el correo se haya perdido o haya caído en spam.',
      },
    ],
  },
  {
    titulo: '6. Derecho de arrepentimiento',
    bloques: [
      {
        tipo: 'p',
        texto: 'Como consumidor tenés derecho a arrepentirte de la compra dentro de los 10 (diez) días corridos contados desde la celebración del contrato o desde la entrega del producto, lo que ocurra después, sin necesidad de expresar ningún motivo y sin costo alguno para vos (art. 34 de la Ley 24.240).',
      },
      {
        tipo: 'p',
        texto: 'Este derecho se respeta también cuando ya descargaste el archivo. No se te va a pedir que justifiques la decisión ni se te va a cobrar ningún cargo por ejercerlo.',
      },
      {
        tipo: 'p',
        texto: 'Para hacerlo podés usar el botón de arrepentimiento disponible en la página de inicio, o escribir al email de contacto indicando tu nombre, el correo con el que compraste y qué producto querés revocar. Se te confirma la recepción y el número de identificación del trámite dentro de las 24 horas, por el mismo medio.',
      },
    ],
  },
  {
    titulo: '7. Reembolsos',
    bloques: [
      {
        tipo: 'p',
        texto: 'Aceptado el arrepentimiento, o detectado un cobro erróneo o duplicado, el reintegro se gestiona por el mismo medio de pago que usaste, sin gastos a tu cargo.',
      },
      {
        tipo: 'p',
        texto: 'El pedido se procesa dentro de los 5 días hábiles de recibido. El plazo en que el dinero se ve efectivamente acreditado depende además de los tiempos del procesador de pagos y de tu banco o emisor de la tarjeta.',
      },
      {
        tipo: 'p',
        texto: 'Ejercido el arrepentimiento, se da de baja el acceso al archivo y cesa la licencia de uso del punto 8.',
      },
    ],
  },
  {
    titulo: '8. Propiedad intelectual',
    bloques: [
      {
        tipo: 'p',
        texto: 'Todo el contenido de los ebooks, los cursos y el material de la plataforma es de autoría de Elías Pacione y está protegido por la Ley 11.723 de Propiedad Intelectual.',
      },
      {
        tipo: 'p',
        texto: 'La compra te da una licencia de uso personal e intransferible. Podés leerlo, estudiarlo, imprimirlo para tu propio uso y citarlo mencionando la fuente.',
      },
      {
        tipo: 'p',
        texto: 'No está permitido revenderlo, redistribuirlo, subirlo a otras plataformas, compartir tu acceso con terceros ni usar el contenido para dictar formaciones propias sin autorización escrita previa.',
      },
    ],
  },
  {
    titulo: '9. Cuentas de alumno',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'La cuenta es personal e intransferible: sos responsable de mantener tu contraseña en reserva.',
          'El material que ves es el que se te asignó. No se accede al contenido de otros alumnos.',
          'El acceso puede suspenderse si se detecta un uso que vulnere estos términos, en particular la redistribución del material.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Podés pedir la baja de tu cuenta en cualquier momento escribiendo al email de contacto.',
      },
    ],
  },
  {
    titulo: '10. Alcance del contenido: no reemplaza un tratamiento',
    bloques: [
      {
        tipo: 'p',
        texto: 'Los ebooks, cursos y formaciones tienen finalidad educativa y psicoeducativa. Comprar o cursar un material NO constituye una relación terapéutica ni equivale a un tratamiento psicológico, y no reemplaza la consulta con un profesional de la salud.',
      },
      {
        tipo: 'p',
        texto: 'El contenido no debe usarse para autodiagnosticarse ni para diagnosticar a terceros. Si estás atravesando una situación de sufrimiento psíquico, lo que corresponde es una consulta profesional: podés escribir por el formulario del sitio para coordinarla.',
      },
      {
        tipo: 'p',
        texto: 'Si hay riesgo inmediato para tu vida o la de otra persona, llamá al 911 desde cualquier punto del país, o al 107 donde haya servicio de emergencias médicas. El Centro de Asistencia al Suicida atiende de 8 a 24 h al 135 (CABA y Gran Buenos Aires) y al 0800 345 1435 desde el resto del país, de forma gratuita y anónima.',
      },
    ],
  },
  {
    titulo: '11. Disponibilidad del sitio',
    bloques: [
      {
        tipo: 'p',
        texto: 'Se procura que la plataforma esté disponible de forma continua, pero pueden existir interrupciones por mantenimiento o por causas ajenas atribuibles a los proveedores de infraestructura.',
      },
      {
        tipo: 'p',
        texto: 'Si una interrupción te impidiera acceder a un contenido ya comprado, el acceso se restablece o se te reintegra lo pagado.',
      },
    ],
  },
  {
    titulo: '12. Reclamos, ley aplicable y jurisdicción',
    bloques: [
      {
        tipo: 'p',
        texto: `Ante cualquier problema, el primer camino es escribir a ${DATOS_TITULAR.email}: la enorme mayoría de las cuestiones se resuelven ahí.`,
      },
      {
        tipo: 'p',
        texto: 'Sin perjuicio de eso, podés presentar un reclamo ante la autoridad de aplicación en materia de defensa del consumidor, a través de la Ventanilla Única Federal de Defensa del Consumidor o del organismo local que corresponda a tu domicilio.',
      },
      {
        tipo: 'p',
        texto: 'Estos términos se rigen por las leyes de la República Argentina, en particular la Ley 24.240 de Defensa del Consumidor y el Código Civil y Comercial de la Nación.',
      },
      {
        tipo: 'p',
        texto: 'Para cualquier controversia resulta competente el tribunal correspondiente al domicilio del consumidor, conforme al art. 36 de la Ley 24.240. Esa competencia es irrenunciable.',
      },
    ],
  },
  {
    titulo: '13. Cambios en estos términos',
    bloques: [
      {
        tipo: 'p',
        texto: 'Los términos pueden actualizarse. La versión aplicable a tu compra es la que estaba publicada en el momento en que la hiciste, y los cambios posteriores no se aplican retroactivamente a operaciones ya cerradas.',
      },
    ],
  },
]

export default function TerminosPage() {
  const faltan = faltanDatosTitular()

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
        <p className="text-tinta/70 mb-8 font-serif">
          Las condiciones de compra y de uso de esta plataforma.
        </p>

        {/* Igual que en /privacidad: el aviso vive solo mientras falten los datos
            identificatorios en utils/datos-titular.ts. */}
        {faltan && (
          <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-10 text-amber-900 dark:text-amber-300">
            <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>Faltan los datos identificatorios del vendedor.</strong> El texto de
              estos términos está completo, pero la matrícula, el CUIT y el domicilio
              todavía no se cargaron. La Res. 424/2020 los exige visibles antes de habilitar
              la venta online.
            </p>
          </div>
        )}

        <div className="space-y-10">
          {secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-2xl font-heading font-semibold text-tinta mb-3">{s.titulo}</h2>
              <div className="space-y-3">
                {s.bloques.map((b, i) =>
                  b.tipo === 'p' ? (
                    <p key={i} className="text-tinta/80 leading-relaxed">
                      {b.texto}
                    </p>
                  ) : (
                    <ul key={i} className="space-y-1.5 pl-1">
                      {b.items.map((item) => (
                        <li key={item} className="text-tinta/80 leading-relaxed flex gap-2.5">
                          <span className="text-marca shrink-0 select-none">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-tinta/70 leading-relaxed">
            ¿Querés dar de baja una compra? Entrá al{' '}
            <Link href="/arrepentimiento" className="text-marca underline underline-offset-2">
              botón de arrepentimiento
            </Link>
            . También podés leer la{' '}
            <Link href="/privacidad" className="text-marca underline underline-offset-2">
              política de privacidad
            </Link>
            .
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
