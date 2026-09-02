const pptxgen = require('pptxgenjs')
const path = require('path')
const fs = require('fs')
const B = require('./brand')

const OUT_DIR = path.join(__dirname, 'out', 'presentacion')
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function run() {
  console.log('Generando presentación ejecutiva con pptxgenjs...')
  const pres = new pptxgen()
  B.setup(pres)

  const CURSO = 'Psicología Aplicada a la Tarea Pastoral'

  // Slide 1: Portada
  B.titleSlide(pres, {
    tag: 'Resumen ejecutivo de la formación',
    curso: CURSO,
    subtitulo: 'Detección temprana, contención inicial y derivación responsable en la comunidad de fe. Herramientas con evidencia: TCC, TREC, ACT y Habilidades de Comunicación.',
  })

  // Slide 2: Los 4 Módulos
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Estructura Curricular' })
    B.slideTitle(s, 'Un programa de 8 semanas organizado en cuatro ejes formativos')
    B.cardRow(s, [
      {
        badge: 'M1',
        eyebrow: 'Módulo 1',
        title: 'Marco Ético y Crisis',
        body: 'Límites éticos entre pastoral y psicoterapia. Protocolo ABCDE de PAP, planes de seguridad en riesgo vital y habilidades de escucha activa.',
      },
      {
        badge: 'M2',
        eyebrow: 'Módulo 2',
        title: 'Modelo Cognitivo',
        body: 'Modelo ABC de Ellis en la consejería. Detección y debate de creencias irracionales y distorsiones cognitivas en el liderazgo.',
      },
      {
        badge: 'M3',
        eyebrow: 'Módulo 3',
        title: 'ACT y Flexibilidad',
        body: 'Terapia de Aceptación y Compromiso: evitación experiencial, defusión cognitiva, brújula de valores y metáforas pastorales.',
      },
      {
        badge: 'M4',
        eyebrow: 'Módulo 4',
        title: 'Cuidado del Líder',
        body: 'Guion asertivo en 4 pasos, método socrático para la consejería y prevención sistemática del burnout y desgaste ministerial.',
      },
    ], { y: 1.95, h: 4.5 })
  }

  // Slide 3: Módulo 1 - Diferencias y Límites
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Módulo 1 · Límites y Competencias' })
    B.slideTitle(s, 'El límite ético define cuándo acompañar y cuándo derivar')
    B.twoColumn(s, {
      left: {
        title: 'Consejo Pastoral Responsable',
        icon: '✝',
        items: [
          'Acompañamiento espiritual en crisis vitales normativas (duelo, decisiones, conflictos).',
          'Sustentado en la fe, la oración comunitaria y los principios bíblicos compartidos.',
          'No diagnostica patologías mentales ni aplica técnicas de psicoterapia clínica.',
          'Reconoce sus competencias y activa redes de salud mental cuando hay riesgo.',
        ],
      },
      right: {
        title: 'Psicoterapia Científica',
        icon: 'Ψ',
        items: [
          'Intervención profesional para evaluación y tratamiento de trastornos psicológicos.',
          'Fundamentada en modelos empíricos validados (TCC, ACT, neurociencias).',
          'Regulada por secreto profesional legal, leyes sanitarias y colegiación oficial.',
          'Trabaja en sinergia con la comunidad cuando el paciente cuenta con red pastoral.',
        ],
      },
      y: 1.95,
      h: 4.5,
    })
  }

  // Slide 4: Módulo 1 - Protocolo ABCDE (PAP)
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Módulo 1 · Intervención en Crisis' })
    B.slideTitle(s, 'Primeros Auxilios Psicológicos: 5 pasos para contener sin invadir')
    B.cardRow(s, [
      {
        badge: 'A',
        eyebrow: 'Paso 1',
        title: 'Escucha Activa',
        body: 'Presencia empática y serena. Validar el dolor sin juzgar, sin interrumpir y sin apresurar citas bíblicas fuera de contexto.',
      },
      {
        badge: 'B',
        eyebrow: 'Paso 2',
        title: 'Ventilación',
        body: 'Respiración consciente guiada (4-4-4) para regular la sobreactivación neurofisiológica y el pánico inicial.',
      },
      {
        badge: 'C',
        eyebrow: 'Paso 3',
        title: 'Categorización',
        body: 'Ayudar a jerarquizar necesidades urgentes (físicas, legales, de salud) frente a la confusión cognitiva.',
      },
      {
        badge: 'D',
        eyebrow: 'Paso 4',
        title: 'Redes y Apoyo',
        body: 'Conectar con familiares de confianza, dispositivos de emergencia o profesionales de salud mental.',
      },
      {
        badge: 'E',
        eyebrow: 'Paso 5',
        title: 'Psicoeducación',
        body: 'Normalizar las reacciones agudas de estrés y acordar pautas básicas de descanso y cuidado para los días siguientes.',
        fill: B.C.tinta,
        textColor: B.C.blanco,
        bodyColor: B.C.grisCalido,
        badgeFill: B.C.blanco,
        badgeColor: B.C.tinta,
      },
    ], { y: 1.95, h: 4.5 })
  }

  // Slide 5: Módulo 2 - Modelo TREC
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Módulo 2 · Terapia Racional Emotiva Conductual' })
    B.slideTitle(s, 'El circuito ABC: las creencias rígidas multiplican el sufrimiento')
    B.cardRow(s, [
      {
        badge: 'A',
        eyebrow: 'Acontecimiento',
        title: 'El Hecho Objetivo',
        body: 'El suceso externo real: un feligrés se aparta, un miembro del equipo renuncia o se recibe una crítica pública.',
      },
      {
        badge: 'B',
        eyebrow: 'Creencias (Beliefs)',
        title: 'Filtro Cognitivo',
        body: 'Exigencias absolutistas: “Debo ser perfecto para Dios”, “No tolero que fallen”. Aquí radica la perturbación emocional.',
      },
      {
        badge: 'C',
        eyebrow: 'Consecuencia',
        title: 'Emoción y Conducta',
        body: 'De B irracional: culpa destructiva, parálisis ministerial, enojo o cinismo. De B racional: tristeza sana y afrontamiento sereno.',
      },
      {
        badge: 'D',
        eyebrow: 'Debate Socrático',
        title: 'Disputa Reflexiva',
        body: 'Cuestionar la exigencia rígida: ¿Dónde dice que no puedo equivocarme? ¿Me ayuda esta creencia o me destruye?',
      },
      {
        badge: 'E',
        eyebrow: 'Efecto Adaptativo',
        title: 'Filosofía Flexible',
        body: 'Reemplazar mandatos por preferencias saludables. Servir desde la gracia y la aceptación de los límites humanos.',
        fill: B.C.tinta,
        textColor: B.C.blanco,
        bodyColor: B.C.grisCalido,
        badgeFill: B.C.blanco,
        badgeColor: B.C.tinta,
      },
    ], { y: 1.95, h: 4.5 })
  }

  // Slide 6: Módulo 3 - ACT y Defusión Cognitiva
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Módulo 3 · Aceptación y Compromiso' })
    B.slideTitle(s, 'Flexibilidad psicológica: convivir con el malestar en pos de valores')
    B.twoColumn(s, {
      left: {
        title: 'La Trampa de la Evitación Experiencial',
        icon: '⚠️',
        items: [
          'Intentar eliminar por la fuerza el dolor, la duda o la tristeza suele amplificarlos.',
          'La lucha contra los pensamientos desagradables agota los recursos emocionales del líder.',
          'Postergar decisiones valiosas hasta que “desaparezca el miedo” paraliza el ministerio.',
          'El sufrimiento inevitable se transforma en sufrimiento patológico cuando se resiste.',
        ],
      },
      right: {
        title: 'Defusión Cognitiva y Acción Valiosa',
        icon: '🧭',
        items: [
          'Observar los pensamientos como eventos mentales pasajeros, no como verdades fijas.',
          '“Noto que mi mente me dice que no soy suficiente” en vez de creerlo de forma literal.',
          'Los valores actúan como brújula: señalan la dirección aun en medio de la tormenta.',
          'Avanzar y servir con fidelidad llevando consigo las dudas y el cansancio natural.',
        ],
      },
      y: 1.95,
      h: 4.5,
    })
  }

  // Slide 7: Módulo 4 - Comunicación Asertiva
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Módulo 4 · Comunicación en el Liderazgo' })
    B.slideTitle(s, 'El guion en 4 pasos transforma el conflicto en colaboración')
    B.cardRow(s, [
      {
        badge: '1',
        eyebrow: 'Paso 1',
        title: 'Hechos Objetivos',
        body: 'Describir la situación sin adjetivos descalificadores ni juicios subjetivos de intención.',
      },
      {
        badge: '2',
        eyebrow: 'Paso 2',
        title: 'Sentimientos Propios',
        body: 'Expresar en primera persona el impacto emocional: “Yo me siento sobrecargado”.',
      },
      {
        badge: '3',
        eyebrow: 'Paso 3',
        title: 'Pedido Específico',
        body: 'Formular una solicitud clara, concreta y viable de modificación de conducta.',
      },
      {
        badge: '4',
        eyebrow: 'Paso 4',
        title: 'Consecuencia Positiva',
        body: 'Explicar el beneficio mutuo del acuerdo para el vínculo y la salud de la comunidad.',
        fill: B.C.tinta,
        textColor: B.C.blanco,
        bodyColor: B.C.grisCalido,
        badgeFill: B.C.blanco,
        badgeColor: B.C.tinta,
      },
    ], { y: 1.95, h: 4.5 })
  }

  // Slide 8: Módulo 4 - Prevención del Burnout
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Módulo 4 · Cuidado del Ministro' })
    B.slideTitle(s, 'El autocuidado del líder no es egoísmo: es mayordomía de la vida')
    B.cardRow(s, [
      {
        badge: '1',
        eyebrow: 'Tríada del Desgaste',
        title: 'Detección Temprana',
        body: 'Reconocer el agotamiento emocional crónico, el distanciamiento afectivo de la gente y la sensación de ineficacia en el servicio.',
      },
      {
        badge: '2',
        eyebrow: 'Límites Saludables',
        title: 'Protección del Tiempo',
        body: 'Fijar horarios claros de disponibilidad, respetar un día semanal no negociable de descanso y delegar funciones administrativas.',
      },
      {
        badge: '3',
        eyebrow: 'Red y Supervisión',
        title: 'Espacios de Acompañamiento',
        body: 'Contar con supervisión profesional para casos complejos y cultivar vínculos entre colegas donde ser vulnerable sin temor.',
        fill: B.C.tinta,
        textColor: B.C.blanco,
        bodyColor: B.C.grisCalido,
        badgeFill: B.C.blanco,
        badgeColor: B.C.tinta,
      },
    ], { y: 1.95, h: 4.5 })
  }

  // Slide 9: Acreditación y Trabajo Final
  {
    const s = pres.addSlide()
    B.chrome(s, { curso: CURSO, leccion: 'Acreditación del Programa' })
    B.slideTitle(s, 'Proyecto de Contención Psicológica Pastoral (PCPP)')
    B.grid(s, [
      {
        title: '1. Diagnóstico Comunitario',
        body: 'Relevamiento anónimo y agregado de las principales necesidades emocionales en la comunidad.',
      },
      {
        title: '2. Protocolo de Escucha',
        body: 'Diseño del dispositivo pastoral de recepción, escucha activa y contención inicial.',
      },
      {
        title: '3. Sistema de Triaje',
        body: 'Criterios claros de semáforo verde, amarillo y rojo para categorizar urgencia y riesgo vital.',
      },
      {
        title: '4. Red de Derivación',
        body: 'Directorio verificado de psicólogos, psiquiatras, hospitales y centros de emergencia zonales.',
      },
      {
        title: '5. Plan de Autocuidado',
        body: 'Pautas de supervisión, límites horarios y rotación para prevenir el desgaste del equipo.',
      },
      {
        title: '6. Confidencialidad y Ética',
        body: 'Políticas de resguardo de datos, anonimización rigurosa y respeto irrestricto de la privacidad.',
      },
    ], { y: 1.95, cols: 3, h: 4.5 })
  }

  const pptxPath = path.join(OUT_DIR, 'presentacion-resumen-ejecutivo.pptx')
  await pres.writeFile({ fileName: pptxPath })
  console.log(`OK -> ${pptxPath}`)
}

run().catch((err) => {
  console.error('Error generando presentación:', err)
  process.exit(1)
})
