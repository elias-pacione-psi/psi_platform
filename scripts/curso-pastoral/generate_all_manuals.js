const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const FONTS = path.join(__dirname, 'fonts')
const ASSETS = __dirname
const WORK_DIR = path.join(__dirname, 'temp_manuals')

if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true })
}

const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  crema: '#f1f0eb',
  blanco: '#ffffff',
  grisCalido: '#d6dee5',
  mutedFg: '#5f6d77',
  verdeAcento: '#3a7d44',
}

// Letter size (matching existing lessons: 612 x 792)
const LETTER_PAGE = { size: 'letter', margins: { top: 72, bottom: 50, left: 54, right: 54 } }
const CONTENT_W = 612 - 108 // 504

function registerFonts(doc) {
  doc.registerFont('Heading-Bold', path.join(FONTS, 'Poppins-Bold.ttf'))
  doc.registerFont('Heading-SemiBold', path.join(FONTS, 'Poppins-SemiBold.ttf'))
  doc.registerFont('Heading-Medium', path.join(FONTS, 'Poppins-Medium.ttf'))
  doc.registerFont('Body', path.join(FONTS, 'Poppins-Regular.ttf'))
  doc.registerFont('Body-Medium', path.join(FONTS, 'Poppins-Medium.ttf'))
  doc.registerFont('Serif-Italic', path.join(FONTS, 'Lora-Italic.ttf'))
}

// 1. Portada del curso
function generarPortada(cursoData, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'letter', margins: { top: 0, bottom: 0, left: 0, right: 0 } })
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    const pw = 612
    const ph = 792
    const topH = 320

    doc.rect(0, 0, pw, topH).fill(C.tinta)
    doc.rect(0, topH, pw, 5).fill(C.marca)

    const markCrema = path.join(ASSETS, 'mark-crema.png')
    if (fs.existsSync(markCrema)) {
      doc.opacity(0.95).image(markCrema, 54, 48, { width: 52, height: 34 })
      doc.opacity(1)
    }

    doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(15)
    doc.text('ELIAS PACIONE', 118, 50, { lineBreak: false })
    doc.fillColor(C.grisCalido).font('Body').fontSize(9)
    doc.text('Psicología con sentido  ·  Plataforma de Formación', 118, 68, { lineBreak: false })

    doc.font('Heading-Bold').fontSize(26).fillColor(C.blanco)
    doc.text(cursoData.tituloLargo || cursoData.titulo, 54, 125, { width: pw - 108, lineGap: 3 })

    doc.font('Body').fontSize(11).fillColor(C.grisCalido)
    doc.text('Manual Integral de Formación Teórico-Práctica', 54, doc.y + 10, { width: pw - 108 })

    doc.y = topH + 30
    doc.font('Heading-SemiBold').fontSize(11).fillColor(C.marca)
    doc.text('PROGRAMA OFICIAL DE FORMACIÓN ASINCRÓNICA', 54, doc.y, { characterSpacing: 0.8 })

    doc.moveDown(0.5)
    doc.font('Body').fontSize(10).fillColor(C.tinta)
    doc.text(cursoData.descripcion, 54, doc.y, { width: pw - 108, lineGap: 2.2, align: 'justify' })

    // Badges de lecciones (2 columnas de 3)
    doc.moveDown(1.2)
    const cardY = doc.y
    const colW = (pw - 108 - 14) / 2
    const cardH = 46

    cursoData.leccionesInfo.forEach((lecc, idx) => {
      const col = idx % 2
      const row = Math.floor(idx / 2)
      const cx = 54 + col * (colW + 14)
      const cy = cardY + row * (cardH + 8)

      doc.rect(cx, cy, colW, cardH).fillAndStroke(C.crema, C.grisCalido)
      doc.rect(cx, cy, 4, cardH).fill(C.marca)

      doc.fillColor(C.marca).font('Heading-SemiBold').fontSize(7.5)
      doc.text(`LECCIÓN ${idx + 1}`, cx + 12, cy + 8, { lineBreak: false })

      doc.fillColor(C.tinta).font('Heading-SemiBold').fontSize(8.2)
      doc.text(lecc.titulo, cx + 12, cy + 20, { width: colW - 20, lineBreak: false })
    })

    const footerY = ph - 60
    doc.moveTo(54, footerY).lineTo(pw - 54, footerY).lineWidth(0.5).strokeColor(C.grisCalido).stroke()
    doc.fillColor(C.tinta).font('Heading-SemiBold').fontSize(8.5)
    doc.text('Docente a cargo: Lic. Elías Pacione (M.N. 63.854)', 54, footerY + 10)
    doc.fillColor(C.mutedFg).font('Body').fontSize(7.8)
    doc.text('Material didáctico para uso exclusivo de los alumnos del programa · Formación Asincrónica', 54, footerY + 22)

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// 2. Encuadre Legal y Ético
function generarLegal(cursoData, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(LETTER_PAGE)
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
    doc.text('ENCUADRE INSTITUCIONAL Y LEGAL', 54, 72, { characterSpacing: 0.6 })
    doc.moveDown(0.3)
    doc.font('Heading-Bold').fontSize(19).fillColor(C.tinta)
    doc.text('Marco Ético, Protección de Datos y Alcances', 54, doc.y)
    const ruleY = doc.y + 6
    doc.moveTo(54, ruleY).lineTo(124, ruleY).lineWidth(3).strokeColor(C.marca).stroke()
    doc.y = ruleY + 16

    // Callout advertencia Ley 25.326
    const calloutY = doc.y
    const boxW = CONTENT_W
    const boxH = 70
    doc.rect(54, calloutY, boxW, boxH).fill('#fff8f0')
    doc.rect(54, calloutY, 4, boxH).fill('#d4a373')
    doc.fillColor('#8a4b00').font('Heading-SemiBold').fontSize(8)
    doc.text('CUMPLIMIENTO DE LA LEY 25.326 DE PROTECCIÓN DE DATOS PERSONALES', 66, calloutY + 10)
    doc.fillColor(C.tinta).font('Body').fontSize(8.2)
    const warningText = 'Este manual constituye un material de formación y consulta teórica exclusivamente educativo. Queda terminantemente prohibido recolectar, registrar o almacenar datos sensibles de salud mental, diagnósticos clínicos o situaciones personales de terceros en plataformas digitales no autorizadas. Todas las actividades y ejercicios sugeridos están diseñados para ser resueltos a mano en el cuaderno de notas personales de cada alumno.'
    doc.text(warningText, 66, calloutY + 22, { width: boxW - 24, lineGap: 1.6, align: 'justify' })
    doc.y = calloutY + boxH + 16

    doc.font('Heading-SemiBold').fontSize(11).fillColor(C.tinta)
    doc.text('1. Distinción de Competencias: Formación Psicoeducativa vs. Psicoterapia', 54, doc.y)
    doc.moveDown(0.3)
    doc.font('Body').fontSize(9).fillColor(C.tinta)
    const p1 = 'El presente material tiene un propósito estrictamente psicoeducativo y de desarrollo de competencias teórico-prácticas. Los conocimientos impartidos no sustituyen la evaluación diagnóstica ni el tratamiento psicoterapéutico o psiquiátrico individualizado, los cuales requieren de un encuadre clínico formal y de profesionales habilitados según las leyes sanitarias vigentes.'
    doc.text(p1, 54, doc.y, { width: CONTENT_W, lineGap: 2.0, align: 'justify' })

    doc.moveDown(0.8)
    doc.font('Heading-SemiBold').fontSize(11).fillColor(C.tinta)
    doc.text('2. Deber Ético de Derivación e Intervención Responsable', 54, doc.y)
    doc.moveDown(0.3)
    doc.font('Body').fontSize(9).fillColor(C.tinta)
    const p2 = 'Frente a situaciones que presenten indicadores de riesgo suicida, autolesiones, violencia interpersonal grave, cuadros psicóticos o descompensación afectiva aguda, el deber primario del profesional o facilitador es activar la derivación inmediata a servicios médicos de urgencia y a profesionales de la salud mental debidamente matriculados.'
    doc.text(p2, 54, doc.y, { width: CONTENT_W, lineGap: 2.0, align: 'justify' })

    doc.moveDown(0.8)
    doc.font('Heading-SemiBold').fontSize(11).fillColor(C.tinta)
    doc.text('3. Confidencialidad y Propiedad Intelectual', 54, doc.y)
    doc.moveDown(0.3)
    doc.font('Body').fontSize(9).fillColor(C.tinta)
    const p3 = 'El contenido de este manual es de uso personal e intransferible para los alumnos inscriptos en la plataforma oficial de Elías Pacione. Queda prohibida su reproducción total o parcial, difusión no autorizada, comercialización o distribución por cualquier medio sin autorización previa por escrito.'
    doc.text(p3, 54, doc.y, { width: CONTENT_W, lineGap: 2.0, align: 'justify' })

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// 3. Separador / Portadilla de Lección
function generarSeparadores(cursoData, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(LETTER_PAGE)
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    cursoData.leccionesInfo.forEach((lecc, idx) => {
      if (idx > 0) doc.addPage(LETTER_PAGE)

      const startY = 90
      doc.rect(54, startY, CONTENT_W, 100).fill(C.tinta)

      doc.fillColor(C.grisCalido).font('Heading-SemiBold').fontSize(9.5)
      doc.text(`PROGRAMA OFICIAL   ·   LECCIÓN ${idx + 1}`, 74, startY + 20, { characterSpacing: 0.6 })

      doc.fillColor(C.blanco).font('Heading-Bold').fontSize(18)
      doc.text(lecc.titulo, 74, startY + 38, { width: CONTENT_W - 40, lineGap: 2 })

      doc.y = startY + 124
      doc.font('Heading-SemiBold').fontSize(10.5).fillColor(C.marca)
      doc.text('PROPÓSITO Y SÍNTESIS DE LA LECCIÓN', 54, doc.y)
      doc.moveDown(0.4)
      doc.font('Body').fontSize(9.5).fillColor(C.tinta)
      doc.text(lecc.sintesis || 'Desarrollo conceptual, evidencia clínica y aplicaciones prácticas del tema. Incluye guías estructuradas de intervención y ejercicios de consolidación.', 54, doc.y, { width: CONTENT_W, lineGap: 2.0, align: 'justify' })

      doc.moveDown(1.0)
      doc.font('Heading-SemiBold').fontSize(10.5).fillColor(C.marca)
      doc.text('CONTENIDOS INCLUIDOS EN ESTA SECCIÓN', 54, doc.y)
      doc.moveDown(0.4)

      const items = [
        'Material de Lectura Oficial (Fundamentos y Guía Técnica)',
        'Cuestionario de Autoevaluación de Comprensión (5 Preguntas)',
        'Consigna de Aplicación Práctica para Cuaderno de Notas'
      ]
      items.forEach((it, iIdx) => {
        doc.rect(58, doc.y + 3, 4, 4).fill(C.marca)
        doc.font('Body-Medium').fontSize(9).fillColor(C.tinta)
        doc.text(it, 70, doc.y, { width: CONTENT_W - 20, lineGap: 1.5 })
        doc.moveDown(0.3)
      })
    })

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// 4. Quizzes / Autoevaluaciones de cada lección
function generarQuizzes(cursoData, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(LETTER_PAGE)
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    cursoData.leccionesInfo.forEach((lecc, idx) => {
      if (idx > 0) doc.addPage(LETTER_PAGE)

      doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
      doc.text(`LECCIÓN ${idx + 1}   ·   AUTOEVALUACIÓN DE COMPRENSIÓN`, 54, 72, { characterSpacing: 0.5 })
      doc.moveDown(0.3)
      doc.font('Heading-Bold').fontSize(18).fillColor(C.tinta)
      doc.text(`Autoevaluación · Lección ${idx + 1}`, 54, doc.y)
      const ruleY = doc.y + 6
      doc.moveTo(54, ruleY).lineTo(124, ruleY).lineWidth(3).strokeColor(C.marca).stroke()
      doc.y = ruleY + 14

      // Callout pauta
      const calloutY = doc.y
      doc.rect(54, calloutY, CONTENT_W, 36).fill(C.crema)
      doc.rect(54, calloutY, 3, 36).fill(C.marca)
      doc.fillColor(C.marca).font('Heading-SemiBold').fontSize(7.5)
      doc.text('PAUTA PEDAGÓGICA FORMATIVA', 64, calloutY + 7)
      doc.fillColor(C.tinta).font('Body').fontSize(7.8)
      doc.text('Respondé las 5 preguntas en tu cuaderno de estudio antes de cotejar con la clave formativa al pie.', 64, calloutY + 18, { width: CONTENT_W - 20 })
      doc.y = calloutY + 46

      const quiz = lecc.quiz
      if (quiz && quiz.preguntas && quiz.preguntas.length > 0) {
        quiz.preguntas.forEach((q, qIdx) => {
          doc.font('Heading-SemiBold').fontSize(9).fillColor(C.tinta)
          doc.text(`${qIdx + 1}. ${q.pregunta}`, 54, doc.y, { width: CONTENT_W, lineGap: 1.4 })
          doc.moveDown(0.2)
          q.opciones.forEach((op, opIdx) => {
            const letra = String.fromCharCode(97 + opIdx)
            doc.font('Body').fontSize(8.2).fillColor(C.tinta)
            doc.text(`    ${letra}) ${op}`, 62, doc.y, { width: CONTENT_W - 16, lineGap: 1.3 })
            doc.moveDown(0.12)
          })
          doc.moveDown(0.3)
        })

        // Clave formativa compacta
        doc.moveDown(0.2)
        const claveY = doc.y
        doc.rect(54, claveY, CONTENT_W, 68).fill('#f8f9fa')
        doc.rect(54, claveY, 3, 68).fill(C.marca)
        doc.fillColor(C.marca).font('Heading-SemiBold').fontSize(7.5)
        doc.text(`CLAVE FORMATIVA DE RESPUESTAS · LECCIÓN ${idx + 1}`, 64, claveY + 7)
        doc.fillColor(C.tinta).font('Body').fontSize(7.6)
        const claveLines = quiz.preguntas.map((q, qIdx) => `${qIdx + 1}: ${q.respuesta_correcta}`).join('  |  ')
        doc.text(claveLines, 64, claveY + 18, { width: CONTENT_W - 20, lineGap: 1.4 })
      }
    })

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// 5. Contraportada institucional
function generarContraportada(outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'letter', margins: { top: 0, bottom: 0, left: 0, right: 0 } })
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    const pw = 612
    const ph = 792

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

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// 6. Índice General dinámico
function generarIndice(cursoData, tocEntries, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(LETTER_PAGE)
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
    doc.text('ESTRUCTURA DEL PROGRAMA', 54, 72, { characterSpacing: 0.6 })
    doc.moveDown(0.3)
    doc.font('Heading-Bold').fontSize(20).fillColor(C.tinta)
    doc.text('Índice General de Contenidos', 54, doc.y)
    const ruleY = doc.y + 6
    doc.moveTo(54, ruleY).lineTo(124, ruleY).lineWidth(3).strokeColor(C.marca).stroke()
    doc.y = ruleY + 18

    tocEntries.forEach(item => {
      const itemY = doc.y
      if (item.isLesson) {
        doc.moveDown(0.3)
        doc.rect(54, doc.y, CONTENT_W, 20).fill(C.tinta)
        doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(8.8)
        doc.text(item.title.toUpperCase(), 62, doc.y + 5, { width: CONTENT_W - 65, lineBreak: false })
        doc.text(`Pág. ${item.pageNum}`, 54 + CONTENT_W - 55, doc.y + 5, { width: 48, align: 'right', lineBreak: false })
        doc.y += 24
      } else {
        doc.font(item.isQuiz ? 'Heading-Medium' : 'Body').fontSize(8.5).fillColor(item.isQuiz ? C.marca : C.tinta)
        doc.text(item.title, 64, itemY, { width: CONTENT_W - 65, lineBreak: false })
        doc.font('Body-Medium').fontSize(8.5).fillColor(C.tinta)
        doc.text(String(item.pageNum), 54 + CONTENT_W - 35, itemY, { width: 35, align: 'right', lineBreak: false })
        doc.y = itemY + 16
      }
    })

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

module.exports = {
  generarPortada,
  generarLegal,
  generarSeparadores,
  generarQuizzes,
  generarContraportada,
  generarIndice,
}
