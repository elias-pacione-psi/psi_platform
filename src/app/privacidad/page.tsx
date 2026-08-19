import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { DATOS_TITULAR, faltanDatosTitular, ULTIMA_ACTUALIZACION_LEGAL } from '@/utils/datos-titular'

export const metadata = { title: 'Política de privacidad | Elias Pacione' }

// Texto redactado sobre la Ley 25.326 (Protección de los Datos Personales) y lo que
// la plataforma efectivamente guarda — ver supabase/schema.sql. Está escrito en
// lenguaje claro a propósito: el art. 4 de la Ley 24.240 exige información "cierta,
// clara y detallada", y una política que nadie entiende no informa a nadie.
//
// Los datos identificatorios del responsable salen de utils/datos-titular.ts.
//
// La §10 del documento legal redactado para el sitio ("Terminos y condiciones
// _eliaspacione_.docx", 12/08/2026) está incorporada acá: los datos de salud de los
// formularios como dato sensible del art. 2, el tratamiento con medidas reforzadas
// (punto 3), los derechos del titular y la mención a la AAIP (punto 8). Los
// proveedores del punto 5 son los que efectivamente se usan, no los que el documento
// enumera de memoria — Mercado Pago está integrado, Ualá aparece solo como link de
// pago manual (ver ComprarEbookButton).

type Bloque =
  | { tipo: 'p'; texto: string }
  | { tipo: 'lista'; items: string[] }

const secciones: { titulo: string; bloques: Bloque[] }[] = [
  {
    titulo: '1. Quién es responsable de tus datos',
    bloques: [
      {
        tipo: 'p',
        texto: `El responsable del tratamiento de los datos personales recogidos en este sitio es ${DATOS_TITULAR.nombre}, ${DATOS_TITULAR.profesion}${DATOS_TITULAR.matricula ? `, ${DATOS_TITULAR.matricula}` : ''}, inscripto en el ${DATOS_TITULAR.colegio}.`,
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
        texto: 'Cualquier consulta sobre esta política, o sobre cómo se tratan tus datos, se responde por ese email. Esta política forma parte integrante de los términos y condiciones del sitio.',
      },
    ],
  },
  {
    titulo: '2. Qué datos se recopilan',
    bloques: [
      {
        tipo: 'p',
        texto: 'Depende de cómo uses el sitio. No hace falta crear una cuenta para navegarlo: las páginas públicas (inicio, cursos, formaciones, supervisiones, terapia individual, ebooks) no piden ningún dato.',
      },
      {
        tipo: 'p',
        texto: 'Si completás el formulario de consultas:',
      },
      {
        tipo: 'lista',
        items: [
          'Nombre y apellido.',
          'Correo electrónico.',
          'Teléfono o WhatsApp (opcional).',
          'Qué te interesa (curso, formación, supervisión, terapia individual u otro).',
          'El texto libre que escribas en «Contanos más» — ver el punto 3.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Si tenés una cuenta de alumno (que se crea únicamente por invitación, o después de comprar un ebook):',
      },
      {
        tipo: 'lista',
        items: [
          'Nombre, correo electrónico y teléfono si lo cargaste.',
          'El material y los cursos que te fueron asignados.',
          'Tu progreso educativo: qué lecciones marcaste como vistas, los intentos y resultados de los cuestionarios de comprensión, y los trabajos que entregues junto con la devolución pedagógica del instructor.',
          'La agenda de tus encuentros: fecha, si es presencial o virtual, el lugar o el enlace de la videollamada.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Si comprás un ebook:',
      },
      {
        tipo: 'lista',
        items: [
          'El correo electrónico con el que hiciste la compra.',
          'Qué ebook compraste, el precio pagado y la fecha.',
          'Una referencia de la operación provista por el procesador de pagos.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Nunca se guardan en esta plataforma los datos de tu tarjeta ni tus credenciales bancarias: esos datos los procesa directamente la plataforma de pago y este sitio no los ve ni los almacena.',
      },
      {
        tipo: 'p',
        texto: 'Por decisión de diseño, y por lo que exige la Ley 25.326 respecto de los datos sensibles, la plataforma NO tiene campos de diagnóstico, historia clínica ni notas de sesión. Los cursos pueden enseñar sobre escalas e instrumentos clínicos, pero la plataforma no los implementa como herramientas de evaluación: son materia de estudio, no funciones del sistema.',
      },
    ],
  },
  {
    titulo: '3. El campo «Contanos más» y los datos de salud',
    bloques: [
      {
        tipo: 'p',
        texto: 'El formulario de consultas tiene un campo de texto libre, opcional, para que puedas contar brevemente qué estás buscando. Como se trata del contacto inicial con un profesional de la salud mental, lo que escribas ahí puede constituir un dato sensible en los términos del art. 2 de la Ley 25.326.',
      },
      {
        tipo: 'p',
        texto: 'Dos cosas importantes: ese campo es enteramente opcional y no necesitás detallar nada clínico para que te respondan. Con decir qué tipo de espacio buscás alcanza y sobra. Todo lo que escribas queda alcanzado por el secreto profesional (punto 9) y solo lo lee Elías.',
      },
      {
        tipo: 'p',
        texto: 'Al enviar el formulario prestás tu consentimiento libre, expreso e informado para que esos datos se traten con la única finalidad de responder tu consulta y, si corresponde, coordinar una primera entrevista. No se usan para ninguna otra cosa.',
      },
      {
        tipo: 'p',
        texto: 'Por su naturaleza, esos datos se guardan con las medidas de seguridad y confidencialidad reforzadas que exige la Ley 25.326: no se comparten con nadie más, no se usan para ningún otro fin y se eliminan cuando dejan de ser necesarios para el contacto o cuando lo pidas.',
      },
    ],
  },
  {
    titulo: '4. Para qué se usan tus datos',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Responder tu consulta y coordinar una entrevista o el inicio de un proceso.',
          'Darte acceso al material y a los cursos que se te asignaron.',
          'Llevar el registro de tu avance educativo y devolverte la corrección de tus trabajos.',
          'Organizar la agenda de encuentros y enviarte recordatorios de las clases.',
          'Entregarte el ebook que compraste y dejar constancia de esa operación.',
          'Cumplir con obligaciones legales, fiscales y contables cuando corresponda.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Tus datos no se venden, no se alquilan y no se ceden a terceros con fines publicitarios. No se hace perfilado comercial ni se toman decisiones automatizadas sobre vos. No se envían newsletters ni comunicaciones promocionales salvo que las pidas expresamente.',
      },
    ],
  },
  {
    titulo: '5. Con quién se comparten',
    bloques: [
      {
        tipo: 'p',
        texto: 'Solo con los proveedores de infraestructura necesarios para que el sitio funcione, y únicamente en lo que cada uno necesita para prestar su servicio:',
      },
      {
        tipo: 'lista',
        items: [
          'Supabase — base de datos y sistema de cuentas.',
          'Cloudflare R2 — almacenamiento de los archivos del material y de los trabajos entregados.',
          'Vercel — alojamiento del sitio.',
          'Resend — envío de los correos de la plataforma (invitaciones, recuperación de contraseña, recordatorios de clase).',
          'Mercado Pago, y en compras puntuales Ualá — cobro de los ebooks; recibe únicamente lo necesario para procesar el pago.',
          'Google Meet, Zoom u otra plataforma de videollamada — solo cuando un encuentro es virtual, y únicamente para que puedas conectarte a la clase o a la sesión. Cada una se rige además por sus propias políticas.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Fuera de eso, tus datos solo se entregarían ante un requerimiento judicial o de autoridad competente, en los supuestos en que la ley obliga a hacerlo.',
      },
    ],
  },
  {
    titulo: '6. Dónde se almacenan y transferencia internacional',
    bloques: [
      {
        tipo: 'p',
        texto: 'Los proveedores mencionados operan servidores ubicados fuera de la República Argentina. Eso implica una transferencia internacional de datos en los términos del art. 12 de la Ley 25.326.',
      },
      {
        tipo: 'p',
        texto: 'Al usar la plataforma y aceptar esta política prestás tu consentimiento a esa transferencia, que se realiza con el único fin de prestarte el servicio descripto acá. Los proveedores elegidos ofrecen estándares de seguridad reconocidos internacionalmente y se obligan contractualmente a tratar los datos solo por cuenta del responsable.',
      },
    ],
  },
  {
    titulo: '7. Cuánto tiempo se conservan',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Consultas del formulario: se conservan mientras sean necesarias para gestionar el contacto, y se eliminan cuando dejan de serlo o cuando lo pidas.',
          'Cuenta de alumno y progreso educativo: mientras la cuenta esté activa y por el tiempo en que el vínculo formativo lo justifique.',
          'Registros de compras: por el plazo que exigen las obligaciones fiscales y contables, y para que puedas volver a descargar lo que compraste.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Cuando pedís la eliminación de tu cuenta, se eliminan tus datos personales y tu material asignado. Pueden subsistir los registros contables de operaciones ya facturadas, porque la ley obliga a conservarlos.',
      },
    ],
  },
  {
    titulo: '8. Tus derechos',
    bloques: [
      {
        tipo: 'p',
        texto: 'La Ley 25.326 te reconoce los derechos de acceso, rectificación, actualización y supresión de tus datos personales. En concreto:',
      },
      {
        tipo: 'lista',
        items: [
          'Acceso: podés pedir qué datos tuyos hay registrados. La respuesta se da dentro de los 10 días corridos y es gratuita, con un intervalo mínimo de seis meses entre pedidos, salvo que acredites un interés legítimo.',
          'Rectificación y actualización: si algún dato está mal o quedó viejo, se corrige dentro de los 5 días hábiles de recibido el reclamo.',
          'Supresión: podés pedir que se borren tus datos, con el mismo plazo de 5 días hábiles, salvo los que deban conservarse por obligación legal.',
        ],
      },
      {
        tipo: 'p',
        texto: `Para ejercerlos, escribí a ${DATOS_TITULAR.email} desde la dirección con la que te registraste, indicando qué querés hacer. No hace falta ningún formulario especial ni justificar el pedido.`,
      },
      {
        tipo: 'p',
        texto: 'La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.',
      },
    ],
  },
  {
    titulo: '9. Secreto profesional',
    bloques: [
      {
        tipo: 'p',
        texto: 'Más allá de lo que exige la ley de datos personales, todo lo que se conversa en el marco de un vínculo profesional está protegido por el secreto profesional que rige el ejercicio de la psicología, y por el art. 10 de la Ley 25.326.',
      },
      {
        tipo: 'p',
        texto: 'Ese deber se mantiene incluso después de terminado el vínculo, y solo cede en los casos excepcionales que la propia ley contempla, como una orden judicial.',
      },
    ],
  },
  {
    titulo: '10. Menores de edad',
    bloques: [
      {
        tipo: 'p',
        texto: 'Cuando el destinatario del servicio es una persona menor de edad, la consulta inicial y la creación de la cuenta las realiza su madre, padre o representante legal, que es quien presta el consentimiento para el tratamiento de los datos, sin perjuicio del derecho del adolescente a ser oído y a que se respete su intimidad según su grado de madurez.',
      },
      {
        tipo: 'p',
        texto: 'No se recopilan datos de menores de edad de forma directa a través de este sitio sin esa intervención.',
      },
    ],
  },
  {
    titulo: '11. Seguridad',
    bloques: [
      {
        tipo: 'p',
        texto: 'La plataforma aplica medidas técnicas para proteger la información:',
      },
      {
        tipo: 'lista',
        items: [
          'Todo el tráfico viaja cifrado (HTTPS).',
          'El acceso requiere sesión autenticada y las contraseñas se guardan cifradas, nunca en texto plano.',
          'La base de datos aplica reglas de acceso por fila: cada alumno solo puede leer lo suyo y lo que se le asignó, verificado en el servidor y no en el navegador.',
          'Los archivos se guardan en almacenamiento privado y se sirven con enlaces firmados que vencen a las pocas horas.',
        ],
      },
      {
        tipo: 'p',
        texto: 'Ningún sistema conectado a internet puede garantizar seguridad absoluta, y esta política no promete lo contrario. Sí hay un compromiso concreto: si llegara a producirse un incidente que afecte tus datos personales, se te informará.',
      },
    ],
  },
  {
    titulo: '12. Cookies',
    bloques: [
      {
        tipo: 'p',
        texto: 'El sitio usa únicamente cookies técnicas, necesarias para que funcione: mantener tu sesión iniciada mientras navegás y recordar si elegís el tema claro u oscuro.',
      },
      {
        tipo: 'p',
        texto: 'No se usan cookies de publicidad, de seguimiento entre sitios ni de perfilado, y no hay servicios de analítica de terceros instalados.',
      },
    ],
  },
  {
    titulo: '13. Cambios en esta política',
    bloques: [
      {
        tipo: 'p',
        texto: 'Si esta política cambia, se publica la versión nueva en esta misma página con su fecha de actualización. Si el cambio fuera sustancial y te afectara directamente, se te avisa por email.',
      },
    ],
  },
]

export default function PrivacidadPage() {
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
        <h1 className="text-4xl font-heading font-semibold text-tinta mb-3">Política de privacidad</h1>
        <p className="text-tinta/70 mb-8 font-serif">
          Qué datos recoge esta plataforma, para qué los usa y qué podés hacer con ellos.
        </p>

        {/* El aviso solo aparece mientras falten los datos identificatorios del
            titular (matrícula, CUIT, domicilio). Se completa utils/datos-titular.ts
            y desaparece solo. */}
        {faltan && (
          <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-10 text-amber-900 dark:text-amber-300">
            <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>Faltan los datos identificatorios del responsable.</strong> El texto
              de esta política está completo, pero la matrícula profesional, el CUIT y el
              domicilio todavía no se cargaron. Son obligatorios antes de vender online.
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
            Esta política forma parte de los{' '}
            <Link href="/terminos" className="text-marca underline underline-offset-2">
              términos y condiciones
            </Link>
            . Si querés dar de baja una compra, entrá al{' '}
            <Link href="/arrepentimiento" className="text-marca underline underline-offset-2">
              botón de arrepentimiento
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
