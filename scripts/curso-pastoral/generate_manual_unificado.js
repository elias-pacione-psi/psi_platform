const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')
const { lecciones } = require('./content')
const { quizzes } = require('./quizzes')
const {
  C,
  PAGE,
  CONTENT_W,
  registerFonts,
  RENDERERS,
} = require('./render')

const FONTS = path.join(__dirname, 'fonts')
const ASSETS = __dirname

const OUT_PATHS = [
  path.join(__dirname, 'out', 'Manual Completo - Psicologia Aplicada a la Tarea Pastoral (Elias Pacione).pdf'),
  '/home/lucas_fedora/R2_Bucket_Psicologo/Formaciones/Curso Pastoral (Pdf ocr)/Manual Completo - Psicologia Aplicada a la Tarea Pastoral (Elias Pacione).pdf',
  '/home/lucas_fedora/R2_Bucket_Psicologo/Formaciones/Psicologia Aplicada a la Tarea Pastoral/Manual Completo - Psicologia Aplicada a la Tarea Pastoral (Elias Pacione).pdf',
]

const MODULOS_INFO = {
  1: {
    titulo: 'Módulo 1 · Marco ético, crisis y escucha',
    desc: 'Dónde termina el consejo pastoral y empieza la psicoterapia. Protocolo ABCDE de Primeros Auxilios Psicológicos, planes de seguridad frente a riesgo vital y la escucha activa como herramienta de intervención.',
    quizKey: 'modulo_1',
  },
  2: {
    titulo: 'Módulo 2 · Modelo cognitivo (TCC / TREC)',
    desc: 'El modelo ABC de Albert Ellis en el acompañamiento pastoral. Detección y reestructuración de creencias irracionales, distorsiones cognitivas en el liderazgo y la técnica de la flecha descendente.',
    quizKey: 'modulo_2',
  },
  3: {
    titulo: 'Módulo 3 · Aceptación y Compromiso (ACT)',
    desc: 'Flexibilidad psicológica frente al dolor inevitable. Evitación experiencial, defusión cognitiva, la brújula de valores personales y metáforas terapéuticas aplicadas a la consejería pastoral.',
    quizKey: 'modulo_3',
  },
  4: {
    titulo: 'Módulo 4 · Comunicación y autocuidado',
    desc: 'Habilidades interpersonales y sostenibilidad ministerial. Guion de comunicación asertiva en 4 pasos, el método socrático en la formación y prevención sistemática del burnout del líder.',
    quizKey: 'modulo_4',
  },
}

function ensureSpace(doc, needed) {
  const bottomLimit = doc.page.height - PAGE.margins.bottom
  if (doc.y + needed > bottomLimit) {
    doc.addPage(PAGE)
  }
}

function drawRunningHeader(doc, cursoTitulo, leccionEtiqueta) {
  const w = doc.page.width
  const barH = 50
  doc.save()
  doc.rect(0, 0, w, barH).fill(C.tinta)

  const markPath = path.join(ASSETS, 'mark-crema.png')
  if (fs.existsSync(markPath)) {
    doc.opacity(0.95).image(markPath, PAGE.margins.left, 16, { width: 26, height: 17 })
    doc.opacity(1)
  }

  doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(10)
  doc.text('ELIAS PACIONE', PAGE.margins.left + 34, 14, { lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(7)
  doc.text('Psicología con sentido', PAGE.margins.left + 34, 27, { lineBreak: false })

  const rightW = 310
  doc.fillColor(C.blanco).font('Heading-Medium').fontSize(8)
  doc.text(cursoTitulo, w - PAGE.margins.right - rightW, 14, { width: rightW, align: 'right', lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(7)
  doc.text(leccionEtiqueta, w - PAGE.margins.right - rightW, 27, { width: rightW, align: 'right', lineBreak: false })

  doc.restore()
}

function drawRunningFooter(doc, pageNum, totalPages) {
  const w = doc.page.width
  const h = doc.page.height
  const y = h - 40

  const savedBottom = doc.page.margins.bottom
  doc.page.margins.bottom = 0

  doc.save()
  doc.moveTo(PAGE.margins.left, y).lineTo(w - PAGE.margins.right, y).lineWidth(0.5).strokeColor(C.grisCalido).stroke()
  doc.fillColor(C.mutedFg).font('Body').fontSize(7)
  doc.text('Material educativo de la plataforma de Elías Pacione · Manual de estudio integral · Uso personal exclusivo', PAGE.margins.left, y + 6, { width: 380, lineBreak: false })
  doc.font('Body-Medium').fontSize(7)
  const pageLabel = `Página ${pageNum} de ${totalPages}`
  doc.text(pageLabel, w - PAGE.margins.right - 90, y + 6, { width: 90, align: 'right', lineBreak: false })
  doc.restore()

  doc.page.margins.bottom = savedBottom
}

async function run() {
  console.log('Iniciando compilación del Manual Unificado en un único PDF...')

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 74, bottom: 52, left: 52, right: 52 },
    bufferPages: true,
    autoFirstPage: false,
  })

  registerFonts(doc)

  const primaryOut = OUT_PATHS[0]
  const stream = fs.createWriteStream(primaryOut)
  doc.pipe(stream)

  const pageTracking = {} // map page index -> { cursoTitulo, leccionEtiqueta, isSpecial }
  const tocEntries = []

  // --------------------------------------------------------------------------
  // 1. PORTADA GENERAL
  // --------------------------------------------------------------------------
  doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } })
  pageTracking[0] = { isCover: true }

  const pw = doc.page.width
  const ph = doc.page.height

  // Fondo superior tinta (40% de la página)
  const topH = 340
  doc.rect(0, 0, pw, topH).fill(C.tinta)

  // Barra de acento
  doc.rect(0, topH, pw, 6).fill(C.marca)

  // Isotipo crema en portada
  const markCrema = path.join(ASSETS, 'mark-crema.png')
  if (fs.existsSync(markCrema)) {
    doc.opacity(0.95).image(markCrema, 64, 55, { width: 56, height: 37 })
    doc.opacity(1)
  }

  doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(16)
  doc.text('ELIAS PACIONE', 132, 57, { lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(9.5)
  doc.text('Psicología con sentido  ·  Plataforma de Formación', 132, 77, { lineBreak: false })

  // Título en blanco sobre fondo oscuro
  doc.font('Heading-Bold').fontSize(27).fillColor(C.blanco)
  doc.text('Psicología Aplicada a la Tarea Pastoral', 64, 135, { width: pw - 128, lineGap: 3 })

  doc.font('Body').fontSize(11.5).fillColor(C.grisCalido)
  doc.text('Manual Integral de Formación Teórico-Práctica', 64, doc.y + 12, { width: pw - 128 })

  // Subtítulo en el cuerpo claro
  doc.y = topH + 35
  doc.font('Heading-SemiBold').fontSize(12).fillColor(C.marca)
  doc.text('PROGRAMA OFICIAL DE 8 SEMANAS', 64, doc.y, { characterSpacing: 0.8 })

  doc.moveDown(0.6)
  doc.font('Body').fontSize(10.5).fillColor(C.tinta)
  const descPortada = 'Detección temprana, contención inicial y derivación responsable de problemáticas de salud mental en la comunidad de fe. Fundamentos basados en evidencia científica integrando TCC, TREC, ACT y habilidades de comunicación interpersonal.'
  doc.text(descPortada, 64, doc.y, { width: pw - 128, lineGap: 2.5, align: 'justify' })

  // 4 Bloques de ejes curriculares en portada
  doc.moveDown(1.2)
  const cardY = doc.y
  const cardW = (pw - 128 - 3 * 10) / 4
  const ejes = [
    { mod: 'MÓDULO 1', tit: 'Marco Ético y Crisis', sub: 'Límites, PAP y Escucha' },
    { mod: 'MÓDULO 2', tit: 'Modelo Cognitivo', sub: 'TREC y Distorsiones' },
    { mod: 'MÓDULO 3', tit: 'ACT y Flexibilidad', sub: 'Defusión y Valores' },
    { mod: 'MÓDULO 4', tit: 'Cuidado del Líder', sub: 'Asertividad y Burnout' },
  ]
  ejes.forEach((e, idx) => {
    const cx = 64 + idx * (cardW + 10)
    doc.rect(cx, cardY, cardW, 76).fillAndStroke(C.crema, C.grisCalido)
    doc.rect(cx, cardY, cardW, 18).fill(C.marca)
    doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(7.5)
    doc.text(e.mod, cx + 6, cardY + 5, { width: cardW - 12, align: 'center' })
    doc.fillColor(C.tinta).font('Heading-SemiBold').fontSize(8.5)
    doc.text(e.tit, cx + 6, cardY + 26, { width: cardW - 12, align: 'center', lineGap: 1 })
    doc.fillColor(C.mutedFg).font('Body').fontSize(7.2)
    doc.text(e.sub, cx + 6, cardY + 50, { width: cardW - 12, align: 'center' })
  })

  // Pie de portada
  const footerY = ph - 65
  doc.moveTo(64, footerY).lineTo(pw - 64, footerY).lineWidth(0.6).strokeColor(C.grisCalido).stroke()
  doc.fillColor(C.tinta).font('Heading-SemiBold').fontSize(9)
  doc.text('Docente a cargo: Lic. Elías Pacione (M.N. 63.854)', 64, footerY + 12)
  doc.fillColor(C.mutedFg).font('Body').fontSize(8)
  doc.text('Material didáctico para uso exclusivo de los alumnos del programa · Dignos, Quilmes', 64, footerY + 26)

  // --------------------------------------------------------------------------
  // 2. ENCUADRE ÉTICO Y LEGAL (LEY 25.326)
  // --------------------------------------------------------------------------
  doc.addPage(PAGE)
  const pLegalIdx = doc.bufferedPageRange().count - 1
  pageTracking[pLegalIdx] = { cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral', leccionEtiqueta: 'Encuadre Legal y Ético' }

  doc.font('Heading-SemiBold').fontSize(9).fillColor(C.marca)
  doc.text('ENCUADRE INSTITUCIONAL Y LEGAL', PAGE.margins.left, doc.y, { characterSpacing: 0.6 })
  doc.moveDown(0.4)
  doc.font('Heading-Bold').fontSize(20).fillColor(C.tinta)
  doc.text('Marco Ético, Protección de Datos y Alcances', PAGE.margins.left, doc.y)
  const ruleLegalY = doc.y + 6
  doc.moveTo(PAGE.margins.left, ruleLegalY).lineTo(PAGE.margins.left + 70, ruleLegalY).lineWidth(3).strokeColor(C.marca).stroke()
  doc.y = ruleLegalY + 18

  RENDERERS.callout(doc, {}, {
    kind: 'warning',
    label: 'CUMPLIMIENTO DE LA LEY 25.326 DE PROTECCIÓN DE DATOS PERSONALES',
    text: 'Este manual constituye un material de formación y consulta teórica exclusivamente educativo. Queda terminantemente prohibido recolectar, registrar o almacenar datos sensibles de salud mental, diagnósticos clínicos o situaciones personales de terceros en plataformas digitales no autorizadas. Todas las actividades, escalas y planes sugeridos en este volumen están diseñados para ser resueltos a mano, en el cuaderno personal de cada líder o en soporte físico independiente.'
  })

  doc.font('Heading-SemiBold').fontSize(12).fillColor(C.tinta)
  doc.text('1. Distinción de Competencias: Acompañamiento vs. Psicoterapia', PAGE.margins.left, doc.y)
  doc.moveDown(0.3)
  doc.font('Body').fontSize(9.3).fillColor(C.tinta)
  const legalP1 = 'La capacitación impartida a través de este programa tiene como objetivo fortalecer las herramientas de contención primaria, escucha empática y discernimiento del liderazgo pastoral. En ningún caso capacita ni habilita legalmente a los participantes para el ejercicio de la psicoterapia, la realización de diagnósticos clínicos según manuales nosológicos (DSM-5, CIE-11) o el tratamiento de trastornos psiquiátricos, funciones que son de estricta reserva profesional según las leyes de ejercicio de la psicología y la medicina en la República Argentina.'
  doc.text(legalP1, PAGE.margins.left, doc.y, { width: CONTENT_W, lineGap: 2.2, align: 'justify' })

  doc.moveDown(0.8)
  doc.font('Heading-SemiBold').fontSize(12).fillColor(C.tinta)
  doc.text('2. Deber Ético de Derivación Oportuna', PAGE.margins.left, doc.y)
  doc.moveDown(0.3)
  doc.font('Body').fontSize(9.3).fillColor(C.tinta)
  const legalP2 = 'Frente a situaciones que presenten indicadores de riesgo suicida, violencia interpersonal grave, sintomatología psicótica, adicciones severas o descompensación afectiva, el deber primario del líder pastoral es la derivación inmediata a profesionales de la salud mental matriculados y a servicios de emergencia médica o judicial de la zona. El acompañamiento pastoral en estos casos debe ser complementario y respetuoso del tratamiento clínico especializado.'
  doc.text(legalP2, PAGE.margins.left, doc.y, { width: CONTENT_W, lineGap: 2.2, align: 'justify' })

  doc.moveDown(0.8)
  doc.font('Heading-SemiBold').fontSize(12).fillColor(C.tinta)
  doc.text('3. Confidencialidad y Propiedad Intelectual', PAGE.margins.left, doc.y)
  doc.moveDown(0.3)
  doc.font('Body').fontSize(9.3).fillColor(C.tinta)
  const legalP3 = 'El contenido de este manual es de uso personal e intransferible para los alumnos inscriptos en la plataforma oficial de Elías Pacione. Queda prohibida su reproducción total o parcial, difusión no autorizada, comercialización o utilización con fines lucrativos ajenos al proceso formativo oficial.'
  doc.text(legalP3, PAGE.margins.left, doc.y, { width: CONTENT_W, lineGap: 2.2, align: 'justify' })

  // --------------------------------------------------------------------------
  // 3. PÁGINAS RESERVADAS PARA ÍNDICE GENERAL (PÁGINAS 3 Y 4)
  // --------------------------------------------------------------------------
  doc.addPage(PAGE)
  const pToc1Idx = doc.bufferedPageRange().count - 1
  pageTracking[pToc1Idx] = { cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral', leccionEtiqueta: 'Índice General (I)' }

  doc.addPage(PAGE)
  const pToc2Idx = doc.bufferedPageRange().count - 1
  pageTracking[pToc2Idx] = { cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral', leccionEtiqueta: 'Índice General (II)' }

  // --------------------------------------------------------------------------
  // 4. MÓDULOS 1 AL 4 Y SUS 16 LECCIONES
  // --------------------------------------------------------------------------
  const modulosNumeros = [1, 2, 3, 4]

  for (const mNum of modulosNumeros) {
    const mInfo = MODULOS_INFO[mNum]
    const leccionesDelModulo = lecciones.filter(l => l.moduloNumero === mNum)

    // A) Separador del Módulo (Portada de Módulo)
    doc.addPage(PAGE)
    const pModIdx = doc.bufferedPageRange().count - 1
    const pModNum = doc.bufferedPageRange().count
    pageTracking[pModIdx] = { cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral', leccionEtiqueta: `Módulo ${mNum}` }

    tocEntries.push({
      isModule: true,
      num: mNum,
      title: mInfo.titulo,
      pageNum: pModNum,
    })

    // Gráfico de separador de módulo
    const startModY = doc.y + 20
    doc.rect(PAGE.margins.left, startModY, CONTENT_W, 110).fill(C.tinta)
    doc.fillColor(C.grisCalido).font('Heading-SemiBold').fontSize(10)
    doc.text(`PROGRAMA DE FORMACIÓN   ·   EJE ${mNum}`, PAGE.margins.left + 24, startModY + 22, { characterSpacing: 0.6 })
    doc.fillColor(C.blanco).font('Heading-Bold').fontSize(20)
    doc.text(mInfo.titulo, PAGE.margins.left + 24, startModY + 42, { width: CONTENT_W - 48, lineGap: 2 })

    doc.y = startModY + 130
    doc.font('Heading-SemiBold').fontSize(11).fillColor(C.marca)
    doc.text('SÍNTESIS PEDAGÓGICA DEL MÓDULO', PAGE.margins.left, doc.y)
    doc.moveDown(0.4)
    doc.font('Body').fontSize(9.8).fillColor(C.tinta)
    doc.text(mInfo.desc, PAGE.margins.left, doc.y, { width: CONTENT_W, lineGap: 2.2, align: 'justify' })

    doc.moveDown(1)
    doc.font('Heading-SemiBold').fontSize(11).fillColor(C.marca)
    doc.text('TEMAS INCLUIDOS EN ESTE MÓDULO', PAGE.margins.left, doc.y)
    doc.moveDown(0.4)

    const temaItems = leccionesDelModulo.map(l => `Tema ${l.temaNumero}: ${l.titulo}`)
    temaItems.push(`Autoevaluación de Comprensión del Módulo ${mNum}`)
    if (mNum === 4) {
      temaItems.push('Trabajo Final Integrador: Proyecto de Contención Psicológica Pastoral')
    }
    RENDERERS.numbered(doc, {}, { items: temaItems })

    // B) Renderizar cada lección del módulo
    for (const leccion of leccionesDelModulo) {
      doc.addPage(PAGE)
      const pLeccIdx = doc.bufferedPageRange().count - 1
      const pLeccNum = doc.bufferedPageRange().count

      const metaLecc = {
        cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral',
        moduloEtiqueta: leccion.moduloEtiqueta,
        leccionEtiqueta: `Módulo ${leccion.moduloNumero} · Tema ${leccion.temaNumero}`,
      }
      pageTracking[pLeccIdx] = metaLecc

      tocEntries.push({
        isModule: false,
        moduloNum: mNum,
        temaNum: leccion.temaNumero,
        title: leccion.titulo,
        pageNum: pLeccNum,
      })

      // Portada del tema
      doc.moveDown(0.2)
      doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
      doc.text(`MÓDULO ${leccion.moduloNumero}   ·   TEMA ${leccion.temaNumero}`, PAGE.margins.left, doc.y, { characterSpacing: 0.5 })
      doc.moveDown(0.35)
      doc.font('Heading-Bold').fontSize(20).fillColor(C.tinta)
      doc.text(leccion.titulo, PAGE.margins.left, doc.y, { width: CONTENT_W })
      if (leccion.subtitulo) {
        doc.moveDown(0.2)
        doc.font('Body').fontSize(10.5).fillColor(C.mutedFg)
        doc.text(leccion.subtitulo, PAGE.margins.left, doc.y, { width: CONTENT_W })
      }
      const ruleY = doc.y + 6
      doc.moveTo(PAGE.margins.left, ruleY).lineTo(PAGE.margins.left + 75, ruleY).lineWidth(3).strokeColor(C.marca).stroke()
      doc.y = ruleY + 14

      // Bloques de la lección
      let skippedTitleH1 = false
      for (const block of leccion.blocks) {
        if (!skippedTitleH1 && block.type === 'h1' && block.text.toLowerCase().includes(leccion.titulo.toLowerCase())) {
          skippedTitleH1 = true
          continue
        }
        const renderer = RENDERERS[block.type]
        if (renderer) {
          renderer(doc, metaLecc, block)
        }
      }
    }

    // C) Sección de Autoevaluación del Módulo
    doc.addPage(PAGE)
    const pQuizIdx = doc.bufferedPageRange().count - 1
    const pQuizNum = doc.bufferedPageRange().count
    const metaQuiz = {
      cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral',
      moduloEtiqueta: mInfo.titulo,
      leccionEtiqueta: `Módulo ${mNum} · Autoevaluación`,
    }
    pageTracking[pQuizIdx] = metaQuiz

    tocEntries.push({
      isQuiz: true,
      moduloNum: mNum,
      title: `Autoevaluación de Comprensión · Módulo ${mNum}`,
      pageNum: pQuizNum,
    })

    doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
    doc.text(`MÓDULO ${mNum}   ·   EVALUACIÓN PEDAGÓGICA`, PAGE.margins.left, doc.y, { characterSpacing: 0.5 })
    doc.moveDown(0.3)
    doc.font('Heading-Bold').fontSize(19).fillColor(C.tinta)
    doc.text(`Autoevaluación de Comprensión · Módulo ${mNum}`, PAGE.margins.left, doc.y)
    const ruleQuizY = doc.y + 6
    doc.moveTo(PAGE.margins.left, ruleQuizY).lineTo(PAGE.margins.left + 75, ruleQuizY).lineWidth(3).strokeColor(C.marca).stroke()
    doc.y = ruleQuizY + 16

    RENDERERS.callout(doc, metaQuiz, {
      kind: 'note',
      label: 'PAUTA DE AUTOEVALUACIÓN EDUCATIVA',
      text: 'Este cuestionario contiene 5 preguntas de comprensión conceptual (umbral pedagógico sugerido: 70%). Respondé cada consigna a conciencia en tu cuaderno antes de cotejar con la clave formativa incluida al final de la sección.'
    })

    const quizData = quizzes[mInfo.quizKey]
    quizData.preguntas.forEach((q, qIdx) => {
      ensureSpace(doc, 75)
      doc.font('Heading-SemiBold').fontSize(10).fillColor(C.tinta)
      doc.text(`${qIdx + 1}. ${q.pregunta}`, PAGE.margins.left, doc.y, { width: CONTENT_W, lineGap: 1.5 })
      doc.moveDown(0.3)
      q.opciones.forEach((op, opIdx) => {
        const letra = String.fromCharCode(97 + opIdx) // a, b, c, d
        doc.font('Body').fontSize(9).fillColor(C.tinta)
        doc.text(`    ${letra}) ${op}`, PAGE.margins.left + 8, doc.y, { width: CONTENT_W - 8, lineGap: 1.5 })
        doc.moveDown(0.15)
      })
      doc.moveDown(0.4)
    })

    // Clave de respuestas comentada
    ensureSpace(doc, 85)
    RENDERERS.callout(doc, metaQuiz, {
      kind: 'stat',
      label: `CLAVE FORMATIVA DE RESPUESTAS · MÓDULO ${mNum}`,
      text: quizData.preguntas.map((q, idx) => `Pregunta ${idx + 1}: ${q.respuesta_correcta}`).join('\n\n')
    })
  }

  // --------------------------------------------------------------------------
  // 5. TRABAJO FINAL INTEGRADOR (PROYECTO PCPP)
  // --------------------------------------------------------------------------
  doc.addPage(PAGE)
  const pFinalIdx = doc.bufferedPageRange().count - 1
  const pFinalNum = doc.bufferedPageRange().count
  const metaFinal = {
    cursoTitulo: 'Psicología Aplicada a la Tarea Pastoral',
    moduloEtiqueta: 'Acreditación del Programa',
    leccionEtiqueta: 'Trabajo Final Integrador',
  }
  pageTracking[pFinalIdx] = metaFinal

  tocEntries.push({
    isFinal: true,
    title: 'Trabajo Final Integrador: Proyecto de Contención Psicológica Pastoral (PCPP)',
    pageNum: pFinalNum,
  })

  doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
  doc.text('ACREDITACIÓN Y APLICACIÓN COMUNITARIA', PAGE.margins.left, doc.y, { characterSpacing: 0.5 })
  doc.moveDown(0.3)
  doc.font('Heading-Bold').fontSize(19).fillColor(C.tinta)
  doc.text('Trabajo Final Integrador · Proyecto PCPP', PAGE.margins.left, doc.y)
  const ruleFinalY = doc.y + 6
  doc.moveTo(PAGE.margins.left, ruleFinalY).lineTo(PAGE.margins.left + 75, ruleFinalY).lineWidth(3).strokeColor(C.marca).stroke()
  doc.y = ruleFinalY + 16

  RENDERERS.p(doc, metaFinal, 'El Trabajo Final Integrador consiste en la elaboración de un **Proyecto de Contención Psicológica Pastoral (PCPP)** aplicable a la comunidad de fe local donde desempeña su labor ministerial. Extensión sugerida: 20 a 30 páginas.')

  RENDERERS.callout(doc, metaFinal, {
    kind: 'warning',
    label: 'ANONIMIZACIÓN RIGUROSA (LEY 25.326)',
    text: 'El diagnóstico comunitario y las situaciones descriptas deben realizarse con datos agregados o casos compuestos ficticios. Queda estrictamente prohibido incluir nombres, iniciales, vínculos reconocibles o cualquier dato sensible que permita identificar a personas de la congregación.'
  })

  RENDERERS.h2(doc, metaFinal, 'Ejes y Criterios de Evaluación (20 Puntos c/u - Total 100)')
  RENDERERS.workbox(doc, metaFinal, {
    label: 'RÚBRICA INSTITUCIONAL DE EVALUACIÓN',
    title: 'Los 5 Ejes del Proyecto Comunitario',
    intro: 'Para la aprobación del programa se requiere alcanzar un mínimo de 70 puntos, evidenciando articulación sólida entre principios bíblicos y ciencia psicológica:',
    steps: [
      ['1. Diagnóstico Comunitario', 'Relevamiento estructurado y anónimo de las principales problemáticas psicosociales y emocionales de la congregación.'],
      ['2. Protocolo de Primera Escucha', 'Diseño del dispositivo formal de recepción, escucha activa y contención inicial de consultas.'],
      ['3. Sistema de Triaje Pastoral', 'Criterios claros de semáforo verde, amarillo y rojo para evaluar nivel de urgencia y riesgo vital.'],
      ['4. Red de Derivación Responsable', 'Directorio verificado y actualizado de psicólogos, psiquiatras, hospitales y centros de emergencia zonales.'],
      ['5. Plan de Autocuidado del Equipo', 'Pautas de supervisión, límites horarios y rotación para prevenir el desgaste y burnout del equipo pastoral.'],
    ]
  })

  // --------------------------------------------------------------------------
  // 6. CONTRAPORTADA / CIERRE INSTITUCIONAL
  // --------------------------------------------------------------------------
  doc.addPage({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 } })
  const pContraIdx = doc.bufferedPageRange().count - 1
  pageTracking[pContraIdx] = { isBackCover: true }

  doc.rect(0, 0, pw, ph).fill(C.tinta)

  const markContra = path.join(ASSETS, 'mark-crema.png')
  if (fs.existsSync(markContra)) {
    doc.opacity(0.9).image(markContra, (pw - 80) / 2, ph / 2 - 110, { width: 80, height: 53 })
    doc.opacity(1)
  }

  doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(20)
  doc.text('ELIAS PACIONE', 0, ph / 2 - 35, { width: pw, align: 'center' })

  doc.fillColor(C.grisCalido).font('Body').fontSize(11)
  doc.text('Psicología con sentido', 0, ph / 2 - 8, { width: pw, align: 'center' })

  const ruleContraY = ph / 2 + 18
  doc.moveTo((pw - 100) / 2, ruleContraY).lineTo((pw + 100) / 2, ruleContraY).lineWidth(1.5).strokeColor(C.marca).stroke()

  doc.fillColor(C.grisCalido).font('Body').fontSize(9)
  doc.text('Formaciones asincrónicas y programas profesionales', 0, ruleContraY + 20, { width: pw, align: 'center' })
  doc.text('www.eliaspacione.com', 0, ruleContraY + 36, { width: pw, align: 'center' })

  // --------------------------------------------------------------------------
  // 7. SEGUNDA PASADA: RELLENAR ÍNDICE GENERAL EN PÁGINAS 3 Y 4
  // --------------------------------------------------------------------------
  console.log('Rellenando Índice General en páginas 3 y 4...')
  
  // Dividir tocEntries entre página 3 (Módulos 1 y 2) y página 4 (Módulos 3 y 4)
  const tocPage1Entries = tocEntries.filter(e => (e.isModule && e.num <= 2) || (e.moduloNum && e.moduloNum <= 2))
  const tocPage2Entries = tocEntries.filter(e => (e.isModule && e.num >= 3) || (e.moduloNum && e.moduloNum >= 3) || e.isFinal)

  function renderTocPage(pageIdx, entries, isFirst) {
    doc.switchToPage(pageIdx)
    doc.y = PAGE.margins.top

    if (isFirst) {
      doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
      doc.text('ESTRUCTURA DEL PROGRAMA', PAGE.margins.left, doc.y, { characterSpacing: 0.6 })
      doc.moveDown(0.3)
      doc.font('Heading-Bold').fontSize(20).fillColor(C.tinta)
      doc.text('Índice General de Contenidos', PAGE.margins.left, doc.y)
      const ruleToc = doc.y + 6
      doc.moveTo(PAGE.margins.left, ruleToc).lineTo(PAGE.margins.left + 75, ruleToc).lineWidth(3).strokeColor(C.marca).stroke()
      doc.y = ruleToc + 18
    } else {
      doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
      doc.text('ESTRUCTURA DEL PROGRAMA (CONTINUACIÓN)', PAGE.margins.left, doc.y, { characterSpacing: 0.6 })
      doc.moveDown(0.3)
      doc.font('Heading-Bold').fontSize(18).fillColor(C.tinta)
      doc.text('Índice General (Módulos 3 y 4)', PAGE.margins.left, doc.y)
      const ruleToc2 = doc.y + 6
      doc.moveTo(PAGE.margins.left, ruleToc2).lineTo(PAGE.margins.left + 75, ruleToc2).lineWidth(3).strokeColor(C.marca).stroke()
      doc.y = ruleToc2 + 18
    }

    for (const item of entries) {
      if (item.isModule) {
        doc.moveDown(0.4)
        doc.rect(PAGE.margins.left, doc.y, CONTENT_W, 20).fill(C.tinta)
        doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(9)
        doc.text(item.title.toUpperCase(), PAGE.margins.left + 8, doc.y + 5, { width: CONTENT_W - 60, lineBreak: false })
        doc.text(`Pág. ${item.pageNum}`, PAGE.margins.left + CONTENT_W - 50, doc.y + 5, { width: 45, align: 'right', lineBreak: false })
        doc.y += 24
      } else if (item.isFinal) {
        doc.moveDown(0.4)
        doc.rect(PAGE.margins.left, doc.y, CONTENT_W, 20).fill(C.marca)
        doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(9)
        doc.text('TRABAJO FINAL INTEGRADOR (PROYECTO PCPP)', PAGE.margins.left + 8, doc.y + 5, { width: CONTENT_W - 60, lineBreak: false })
        doc.text(`Pág. ${item.pageNum}`, PAGE.margins.left + CONTENT_W - 50, doc.y + 5, { width: 45, align: 'right', lineBreak: false })
        doc.y += 24
      } else {
        const itemY = doc.y
        const titleText = item.isQuiz ? item.title : `Tema ${item.temaNum} · ${item.title}`
        doc.font(item.isQuiz ? 'Heading-Medium' : 'Body').fontSize(8.8).fillColor(item.isQuiz ? C.marca : C.tinta)
        doc.text(titleText, PAGE.margins.left + 10, itemY, { width: CONTENT_W - 60, lineBreak: false })
        
        // Dotted leader
        doc.font('Body-Medium').fontSize(8.8).fillColor(C.tinta)
        doc.text(String(item.pageNum), PAGE.margins.left + CONTENT_W - 35, itemY, { width: 35, align: 'right', lineBreak: false })
        doc.y = itemY + 16
      }
    }
  }

  renderTocPage(pToc1Idx, tocPage1Entries, true)
  renderTocPage(pToc2Idx, tocPage2Entries, false)

  // --------------------------------------------------------------------------
  // 8. TERCERA PASADA: RUNNING HEADERS Y FOOTERS EN TODAS LAS PÁGINAS INTERNAS
  // --------------------------------------------------------------------------
  const totalPages = doc.bufferedPageRange().count
  console.log(`Dibujando cabeceras y pies en las ${totalPages} páginas del manual...`)

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const track = pageTracking[pIdx] || {}
    if (track.isCover || track.isBackCover) {
      continue // Portada y contraportada no llevan cabecera ni pie
    }

    doc.switchToPage(pIdx)
    const cursoTitulo = track.cursoTitulo || 'Psicología Aplicada a la Tarea Pastoral'
    const leccionEtiqueta = track.leccionEtiqueta || 'Manual de Formación'

    drawRunningHeader(doc, cursoTitulo, leccionEtiqueta)
    drawRunningFooter(doc, pIdx + 1, totalPages)
  }

  doc.end()

  stream.on('finish', () => {
    const stats = fs.statSync(primaryOut)
    const mb = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`
Manual Unificado compilado con éxito!`)
    console.log(`Archivo principal: ${primaryOut} (${mb} MB, ${totalPages} páginas)`)

    // Copiar a las otras rutas de destino
    for (let i = 1; i < OUT_PATHS.length; i++) {
      const dest = OUT_PATHS[i]
      try {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(primaryOut, dest)
        console.log(`Copiado a: ${dest}`)
      } catch (err) {
        console.warn(`Aviso al copiar a ${dest}: ${err.message}`)
      }
    }
  })
}

run().catch((err) => {
  console.error('Error generando manual unificado:', err)
  process.exit(1)
})
