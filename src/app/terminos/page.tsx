import Link from 'next/link'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { DATOS_TITULAR, faltanDatosTitular, ULTIMA_ACTUALIZACION_LEGAL } from '@/utils/datos-titular'

export const metadata = { title: 'Términos y condiciones | Elias Pacione' }

// El contenido de esta página es el documento legal redactado por el abogado para el
// sitio ("Terminos y condiciones _eliaspacione_.docx", 12/08/2026), volcado completo:
// identificación del prestador y domicilio electrónico constituido (§1), objeto y
// aceptación (§2), capacidad y menores (§3), registro y cuenta (§4), descripción de
// los servicios (§5), precios y pago (§6), revocación (§7), cancelaciones (§8),
// propiedad intelectual (§9), datos personales (§10), confidencialidad (§11), límites
// de responsabilidad (§12), conducta (§13), reclamos (§14), modificaciones (§15),
// domicilio y jurisdicción (§16), vigencia (§17) y contacto (§18).
//
// Se reordenó y se pasó a lenguaje llano (art. 4 de la Ley 24.240 pide información
// "cierta, clara y detallada"), pero sin recortar ni ablandar ninguna cláusula. Dos
// cosas que arrastran consecuencias en el código, no solo en el texto:
//
//   - Punto 9: la reserva sobre el reintegro de contenido digital ya accedido depende
//     de que el usuario haya prestado "conformidad previa y expresa al acceso
//     inmediato". Esa conformidad se toma en el diálogo de compra
//     (components/ComprarEbookButton.tsx). Si se saca de ahí, la reserva del punto 9
//     se queda sin sustento y hay que sacarla también.
//   - Punto 17: la prórroga a los tribunales de Quilmes convive con la opción del
//     consumidor por el juez de su domicilio (art. 36), tal como la redactó el
//     abogado. No quitar esa reserva: sin ella la cláusula sería nula.
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
        texto: `Los productos y servicios ofrecidos en ${DATOS_TITULAR.sitio} son comercializados por ${DATOS_TITULAR.nombre}, ${DATOS_TITULAR.profesion}${DATOS_TITULAR.matricula ? `, ${DATOS_TITULAR.matricula}` : ''}, inscripto en el ${DATOS_TITULAR.colegio}.`,
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
        texto: 'Ese correo es el domicilio electrónico constituido a los efectos de estos términos: es la vía válida para cualquier notificación, reclamo o pedido vinculado a una compra o a una cuenta.',
      },
    ],
  },
  {
    titulo: '2. Objeto y aceptación',
    bloques: [
      {
        tipo: 'p',
        texto: 'Estos términos regulan el acceso y uso de la plataforma, y la contratación de los productos y servicios que a través de ella se ofrecen:',
      },
      {
        tipo: 'lista',
        items: [
          'Libros electrónicos (ebooks).',
          'Cursos asincrónicos sobre temáticas de psicología.',
          'Formaciones sincrónicas dictadas en vivo por videollamada, organizadas en cohortes con días y horarios asignados.',
          'Canales de contacto para la eventual contratación de servicios profesionales personalizados: terapia individual, consultoría pastoral y supervisión clínica para terapeutas.',
        ],
      },
      {
        tipo: 'p',
        texto: 'El acceso, la navegación o el uso de la plataforma, así como el registro de una cuenta o la contratación de cualquiera de estos servicios, implica la lectura, comprensión y aceptación plena e incondicional de estos términos. Quien no esté de acuerdo con la totalidad de su contenido debe abstenerse de utilizar la plataforma.',
      },
      {
        tipo: 'p',
        texto: 'Te recomendamos leerlos cada vez que entres al sitio, porque pueden modificarse conforme a lo previsto en el punto 18.',
      },
      {
        tipo: 'p',
        texto: 'Hoy los ebooks se compran directamente desde la web. Los cursos, las formaciones, la supervisión y la terapia individual se coordinan con Elías a partir del formulario de consulta: el acceso se habilita después de esa conversación.',
      },
    ],
  },
  {
    titulo: '3. Quién puede contratar',
    bloques: [
      {
        tipo: 'p',
        texto: 'Comprar en el sitio y tener una cuenta de alumno está reservado a personas mayores de 18 años con capacidad legal para contratar. Se puede pedir información adicional para verificar la edad, y si se detecta que una persona menor de edad accedió sin autorización de sus representantes legales, el acceso se suspende o se da de baja.',
      },
      {
        tipo: 'p',
        texto: 'Cuando el destinatario de un servicio profesional es una persona menor de edad, quien contrata y presta el consentimiento es su madre, padre o representante legal, sin perjuicio del derecho de esa persona a ser oída y a que se respete su intimidad según su grado de madurez.',
      },
    ],
  },
  {
    titulo: '4. Precios',
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
    titulo: '5. Cómo se paga',
    bloques: [
      {
        tipo: 'p',
        texto: 'El pago se procesa a través de Mercado Pago y, en algunas compras puntuales, mediante un link de pago de Mercado Pago o Ualá. Cada una de esas plataformas se rige además por sus propios términos y condiciones.',
      },
      {
        tipo: 'p',
        texto: 'El cobro lo procesa esa plataforma, no este sitio: los datos de tu tarjeta nunca pasan por acá ni quedan almacenados en esta web. El comprobante fiscal correspondiente se emite conforme a la normativa vigente.',
      },
      {
        tipo: 'p',
        texto: 'La compra queda perfeccionada una vez acreditado el pago.',
      },
    ],
  },
  {
    titulo: '6. Cómo se entrega',
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
    titulo: '7. Cursos y formaciones: cómo funciona el acceso',
    bloques: [
      {
        tipo: 'p',
        texto: 'Los cursos asincrónicos dan acceso a material grabado y escrito dentro de la plataforma, que recorrés a tu propio ritmo durante el período de acceso que se te informe al asignártelo. Vencido ese período el acceso puede darse de baja, salvo que se te haya indicado otra cosa.',
      },
      {
        tipo: 'p',
        texto: 'Las formaciones sincrónicas son clases en vivo por videollamada (Google Meet, Zoom u otra plataforma de terceros), organizadas en cohortes con cupo, días y horarios preestablecidos, que se informan antes de la inscripción. Al inscribirte quedás asignado a una cohorte y te comprometés con el cronograma de cursada informado.',
      },
      {
        tipo: 'p',
        texto: 'Si las clases se graban, por cuánto tiempo quedan disponibles y cómo se recuperan los encuentros a los que no pudiste asistir es lo que se detalle para esa formación en particular al momento de inscribirte. Esa información forma parte de estos términos respecto de esa formación.',
      },
      {
        tipo: 'p',
        texto: 'El dictado en vivo puede verse afectado por circunstancias ajenas: fallas de conectividad, caídas de la plataforma de videollamada, caso fortuito o fuerza mayor. Cuando la causa sea atribuible a Elías, la clase se reprograma o se compensa por medios razonables.',
      },
    ],
  },
  {
    titulo: '8. Terapia individual, supervisión y consultoría pastoral',
    bloques: [
      {
        tipo: 'p',
        texto: 'Estos servicios no se prestan a través de la plataforma: el sitio únicamente canaliza el contacto inicial. La entrevista o sesión, si se acuerda, se coordina directamente y se realiza por fuera del sitio, por videollamada (Google Meet u otro servicio de terceros) o de manera presencial.',
      },
      {
        tipo: 'p',
        texto: 'Los presta Elías Pacione en su carácter de profesional matriculado, a título personal y bajo su exclusiva responsabilidad profesional, ética y deontológica, con sujeción a las normas que rigen su matrícula. El vínculo se rige por las normas específicas de la práctica profesional y por un consentimiento informado independiente, que se pone a disposición antes de iniciar las sesiones.',
      },
      {
        tipo: 'p',
        texto: 'Todo lo que se conversa en ese marco está alcanzado por el secreto profesional, con las excepciones que prevé la normativa aplicable — entre ellas, situaciones de riesgo cierto e inminente para la vida o la integridad física propia o de terceros.',
      },
      {
        tipo: 'p',
        texto: 'Por tratarse de servicios de profesionales liberales que requieren título universitario y matrícula habilitante, quedan excluidos del régimen de la Ley 24.240 conforme a su art. 2. Los honorarios, la forma de pago y la política de cancelación de turnos se acuerdan directamente con Elías al momento de coordinar.',
      },
    ],
  },
  {
    titulo: '9. Derecho de arrepentimiento',
    bloques: [
      {
        tipo: 'p',
        texto: 'Como consumidor tenés derecho a arrepentirte de la compra dentro de los 10 (diez) días corridos contados desde la celebración del contrato o desde la entrega del producto, lo que ocurra después, sin necesidad de expresar ningún motivo y sin costo alguno para vos (art. 34 de la Ley 24.240).',
      },
      {
        tipo: 'p',
        texto: 'No hace falta que justifiques la decisión ni se te cobra cargo alguno por ejercerlo.',
      },
      {
        tipo: 'p',
        texto: 'Con una salvedad para el contenido digital: si se trata de un ebook o de los módulos de un curso asincrónico que ya accediste o descargaste dentro del plazo de revocación, habiendo prestado tu conformidad previa y expresa a ese acceso inmediato al momento de comprar, esa circunstancia puede hacerse valer para evaluar si corresponde el reintegro y con qué alcance, en los términos y con los límites que admita la normativa de defensa del consumidor vigente al momento del reclamo.',
      },
      {
        tipo: 'p',
        texto: 'Para hacerlo podés usar el botón de arrepentimiento disponible en la página de inicio, o escribir al email de contacto indicando tu nombre, el correo con el que compraste y qué producto querés revocar. Se te confirma la recepción y el número de identificación del trámite dentro de las 24 horas, por el mismo medio.',
      },
      {
        tipo: 'p',
        texto: 'El arrepentimiento alcanza a lo que se compra por la web. No se aplica a los servicios profesionales personalizados del punto 8, que están fuera del régimen de la Ley 24.240 por su art. 2: la cancelación de un turno se rige por lo que se haya acordado directamente con Elías.',
      },
    ],
  },
  {
    titulo: '10. Reembolsos',
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
        texto: 'Ejercido el arrepentimiento, se da de baja el acceso al archivo y cesa la licencia de uso del punto 12.',
      },
    ],
  },
  {
    titulo: '11. Cancelaciones, reprogramaciones e inasistencias',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Cursos asincrónicos: podés entrar al contenido durante todo el período de acceso; no hay reintegros por no haberlo usado una vez vencido ese período, sin perjuicio del derecho de arrepentimiento del punto 9.',
          'Formaciones sincrónicas: las bajas, los cambios de cohorte y los reintegros parciales una vez empezada la cursada se rigen por la política específica que se te informe al momento de inscribirte.',
          'Terapia, supervisión y consultoría pastoral: la cancelación o reprogramación de turnos se rige por la política que Elías te informe al coordinar el turno.',
        ],
      },
    ],
  },
  {
    titulo: '12. Propiedad intelectual',
    bloques: [
      {
        tipo: 'p',
        texto: 'Todo el contenido de los ebooks, los cursos, las grabaciones de las formaciones y el material de la plataforma es de autoría de Elías Pacione, o de terceros que autorizaron su uso, y está protegido por la Ley 11.723 de Propiedad Intelectual.',
      },
      {
        tipo: 'p',
        texto: 'La compra o la asignación de un material te da una licencia de uso personal, no exclusiva, intransferible y revocable. Podés leerlo, estudiarlo, imprimirlo para tu propio uso y citarlo mencionando la fuente.',
      },
      {
        tipo: 'p',
        texto: 'No está permitido revenderlo, redistribuirlo, subirlo a otras plataformas, compartir tu acceso con terceros ni usar el contenido para dictar formaciones propias sin autorización escrita previa.',
      },
    ],
  },
  {
    titulo: '13. Cuentas de alumno y uso de la plataforma',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Para acceder a los cursos, las formaciones y el material dentro de la plataforma hace falta una cuenta, con datos personales veraces, exactos y actualizados. El ebook comprado también podés bajarlo desde el enlace que se te envía por correo, sin crear cuenta.',
          'La cuenta es personal e intransferible: sos responsable de mantener tus credenciales en reserva y de toda actividad realizada desde tu cuenta.',
          'El material que ves es el que se te asignó. No se accede al contenido de otros alumnos.',
          'No se pueden grabar, reproducir ni difundir sin autorización las clases ni el material de los cursos y formaciones.',
          'No se puede usar la plataforma con fines contrarios a la ley, ni de un modo que perturbe el desarrollo de las clases en vivo o afecte a los demás participantes.',
        ],
      },
      {
        tipo: 'p',
        texto: 'El acceso puede suspenderse o cancelarse ante indicios de uso fraudulento, suministro de información falsa, incumplimiento de estos términos o de la normativa aplicable — en particular, la redistribución del material —, sin perjuicio de las acciones legales que correspondan.',
      },
      {
        tipo: 'p',
        texto: 'Podés pedir la baja de tu cuenta en cualquier momento escribiendo al email de contacto.',
      },
    ],
  },
  {
    titulo: '14. Tus datos personales',
    bloques: [
      {
        tipo: 'p',
        texto: 'El tratamiento de los datos que dejás en el sitio se rige por la Ley 25.326 de Protección de los Datos Personales y por la política de privacidad, que forma parte integrante de estos términos.',
      },
      {
        tipo: 'p',
        texto: 'En los formularios de contacto de terapia, supervisión y consultoría pastoral puede que compartas información vinculada a tu salud, que es un dato sensible en los términos del art. 2 de la Ley 25.326. Ese campo es opcional, se trata únicamente con tu consentimiento previo, expreso e informado, con la sola finalidad de responder tu consulta y coordinar una primera entrevista, y con medidas de seguridad y confidencialidad reforzadas.',
      },
      {
        tipo: 'p',
        texto: `Podés ejercer en cualquier momento tus derechos de acceso, rectificación, actualización y supresión escribiendo a ${DATOS_TITULAR.email}. La Agencia de Acceso a la Información Pública, en su carácter de órgano de control de la Ley 25.326, atiende las denuncias y reclamos por incumplimiento de las normas de protección de datos personales.`,
      },
    ],
  },
  {
    titulo: '15. Alcance del contenido: no reemplaza un tratamiento',
    bloques: [
      {
        tipo: 'p',
        texto: 'Los ebooks, cursos y formaciones tienen finalidad educativa y psicoeducativa. Comprar o cursar un material NO constituye una relación terapéutica ni equivale a un tratamiento psicológico, psiquiátrico o médico, no implica un diagnóstico y no reemplaza la consulta con un profesional de la salud.',
      },
      {
        tipo: 'p',
        texto: 'El contenido no debe usarse para autodiagnosticarse ni para diagnosticar a terceros, y no está diseñado para atender situaciones de urgencia o emergencia en salud mental. Si estás atravesando una situación de sufrimiento psíquico, lo que corresponde es una consulta profesional: podés escribir por el formulario del sitio para coordinarla.',
      },
      {
        tipo: 'p',
        texto: 'Si hay riesgo inmediato para tu vida o la de otra persona, llamá al 911 desde cualquier punto del país, o al 107 donde haya servicio de emergencias médicas. El Centro de Asistencia al Suicida atiende de 8 a 24 h al 135 (CABA y Gran Buenos Aires) y al 0800 345 1435 desde el resto del país, de forma gratuita y anónima.',
      },
    ],
  },
  {
    titulo: '16. Disponibilidad del sitio y responsabilidad',
    bloques: [
      {
        tipo: 'p',
        texto: 'Se procura que la plataforma esté disponible de forma continua, pero pueden existir interrupciones por mantenimiento o por causas ajenas atribuibles a los proveedores de infraestructura. Tampoco puede garantizarse el funcionamiento de las plataformas de terceros que se usan para las clases en vivo y las videollamadas (Google Meet, Zoom u otras), que están fuera de nuestro control.',
      },
      {
        tipo: 'p',
        texto: 'Si una interrupción te impidiera acceder a un contenido ya comprado, el acceso se restablece o se te reintegra lo pagado.',
      },
      {
        tipo: 'p',
        texto: 'No se responde por daños derivados de causas ajenas a la esfera de control de Elías, como fallas de tu conexión a internet, interrupciones del servicio o eventos de caso fortuito o fuerza mayor.',
      },
      {
        tipo: 'p',
        texto: 'Nada de lo dicho en este punto limita los derechos irrenunciables que la Ley 24.240 y demás normativa de orden público te reconocen como consumidor.',
      },
    ],
  },
  {
    titulo: '17. Reclamos, ley aplicable y jurisdicción',
    bloques: [
      {
        tipo: 'p',
        texto: `Ante cualquier problema, el primer camino es escribir a ${DATOS_TITULAR.email}: la enorme mayoría de las cuestiones se resuelven ahí, y se procura responder en un plazo razonable.`,
      },
      {
        tipo: 'p',
        texto: 'Sin perjuicio de eso, podés presentar un reclamo ante la autoridad de aplicación en materia de defensa del consumidor, a través de la Ventanilla Única Federal de Defensa del Consumidor o del organismo local que corresponda a tu domicilio.',
      },
      {
        tipo: 'p',
        texto: `A todos los efectos derivados de estos términos, ${DATOS_TITULAR.nombre} constituye domicilio real en ${DATOS_TITULAR.domicilio} y domicilio electrónico en ${DATOS_TITULAR.email}, que es el domicilio especial del vínculo.`,
      },
      {
        tipo: 'p',
        texto: 'Estos términos se rigen por las leyes de la República Argentina, en particular la Ley 24.240 de Defensa del Consumidor, el Código Civil y Comercial de la Nación y la Ley 25.326 de Protección de los Datos Personales.',
      },
      {
        tipo: 'p',
        texto: 'Para toda controversia que pudiera suscitarse, y sin perjuicio de las normas de orden público que rigen la competencia en las relaciones de consumo —que te habilitan, como consumidor, a optar entre otros por el juez de tu propio domicilio conforme al art. 36 de la Ley 24.240—, las partes se someten a la competencia de los tribunales ordinarios con asiento en el Departamento Judicial de Quilmes, Provincia de Buenos Aires.',
      },
    ],
  },
  {
    titulo: '18. Vigencia, cambios y contacto',
    bloques: [
      {
        tipo: 'p',
        texto: 'Estos términos rigen desde su publicación en el sitio y se aplican a toda contratación realizada a través de él mientras estén vigentes.',
      },
      {
        tipo: 'p',
        texto: 'Pueden actualizarse. La versión aplicable a tu compra es la que estaba publicada en el momento en que la hiciste: los cambios posteriores no se aplican retroactivamente a operaciones ya cerradas, salvo que resulten más beneficiosos para el consumidor.',
      },
      {
        tipo: 'p',
        texto: `Ante cualquier consulta sobre estos términos podés escribir a ${DATOS_TITULAR.email}.`,
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
