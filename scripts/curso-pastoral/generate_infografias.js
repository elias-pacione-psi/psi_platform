const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const FONTS = path.join(__dirname, 'fonts')
const ASSETS = __dirname
const OUT_DIR = path.join(__dirname, 'out', 'infografias')

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  crema: '#f1f0eb',
  blanco: '#ffffff',
  grisCalido: '#d6dee5',
  mutedFg: '#5f6d77',
  verde: '#2d6a4f',
  amarillo: '#d4a373',
  rojo: '#c44536',
}

function registerFonts(doc) {
  doc.registerFont('Heading-Bold', path.join(FONTS, 'Poppins-Bold.ttf'))
  doc.registerFont('Heading-SemiBold', path.join(FONTS, 'Poppins-SemiBold.ttf'))
  doc.registerFont('Heading-Medium', path.join(FONTS, 'Poppins-Medium.ttf'))
  doc.registerFont('Body', path.join(FONTS, 'Poppins-Regular.ttf'))
  doc.registerFont('Body-Medium', path.join(FONTS, 'Poppins-Medium.ttf'))
  doc.registerFont('Serif-Italic', path.join(FONTS, 'Lora-Italic.ttf'))
}

function drawInfografiaHeader(doc, title, subtitle, tag) {
  const w = doc.page.width
  const barH = 54
  doc.save()
  doc.rect(0, 0, w, barH).fill(C.tinta)

  const markPath = path.join(ASSETS, 'mark-crema.png')
  if (fs.existsSync(markPath)) {
    doc.opacity(0.95).image(markPath, 40, 18, { width: 28, height: 18 })
    doc.opacity(1)
  }

  doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(11)
  doc.text('ELIAS PACIONE', 78, 15, { lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(7.5)
  doc.text('Psicología con sentido', 78, 30, { lineBreak: false })

  doc.fillColor(C.blanco).font('Heading-Medium').fontSize(8.5)
  doc.text('Psicología Aplicada a la Tarea Pastoral', w - 40 - 320, 15, { width: 320, align: 'right', lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(7.5)
  doc.text(tag, w - 40 - 320, 30, { width: 320, align: 'right', lineBreak: false })
  doc.restore()

  doc.y = 78
  doc.font('Heading-SemiBold').fontSize(9).fillColor(C.marca)
  doc.text('MAPA CONCEPTUAL VISUAL', 40, doc.y, { characterSpacing: 0.6 })
  doc.moveDown(0.3)
  doc.font('Heading-Bold').fontSize(22).fillColor(C.tinta)
  doc.text(title, 40, doc.y)
  doc.moveDown(0.2)
  doc.font('Body').fontSize(10).fillColor(C.mutedFg)
  doc.text(subtitle, 40, doc.y)

  const ruleY = doc.y + 8
  doc.moveTo(40, ruleY).lineTo(140, ruleY).lineWidth(3).strokeColor(C.marca).stroke()
  doc.y = ruleY + 20
}

function drawInfografiaFooter(doc) {
  const w = doc.page.width
  const h = doc.page.height
  const y = h - 36
  doc.save()
  doc.moveTo(40, y).lineTo(w - 40, y).lineWidth(0.6).strokeColor(C.grisCalido).stroke()
  doc.fillColor(C.mutedFg).font('Body').fontSize(7.2)
  doc.text('Material formativo de la plataforma de Elías Pacione · Infografía de consulta pedagógica · Uso personal exclusivo', 40, y + 8, { width: 500, lineBreak: false })
  doc.restore()
}

// 1. INFOGRAFÍA PAP (ABCDE)
function generarInfografiaPap() {
  return new Promise((resolve, reject) => {
    const outPath = path.join(OUT_DIR, 'infografia-pap-protocolo-abcde.pdf')
    const doc = new PDFDocument({ size: [1200, 750], margins: { top: 0, bottom: 0, left: 0, right: 0 } })
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    drawInfografiaHeader(
      doc,
      'Protocolo ABCDE en Primeros Auxilios Psicológicos (PAP)',
      'Guía paso a paso para la contención inicial y estabilización emocional en contextos comunitarios y pastorales',
      'Módulo 1 · Herramienta de Intervención en Crisis'
    )

    const startY = doc.y + 10
    const steps = [
      {
        letter: 'A',
        title: 'Escucha Activa',
        badge: 'PASO 1',
        desc: 'Brindar presencia serena y acogedora. Escuchar sin juzgar, sin interrumpir y sin apresurar respuestas o versículos descontextualizados.',
        claves: ['Mirada atenta y postura abierta', 'Reflejar la emoción percibida', 'No minimizar el dolor']
      },
      {
        letter: 'B',
        title: 'Ventilación',
        badge: 'PASO 2',
        desc: 'Facilitar la regulación fisiológica ante el desborde o pánico mediante técnicas de respiración diafragmática consciente.',
        claves: ['Respiración 4-4-4 o 4-7-8', 'Tomar agua pausadamente', 'Foco en el cuerpo y el aquí y ahora']
      },
      {
        letter: 'C',
        title: 'Categorización',
        badge: 'PASO 3',
        desc: 'Ayudar a la persona en crisis a jerarquizar y ordenar sus necesidades inmediatas frente a la confusión cognitiva.',
        claves: ['Diferenciar lo urgente de lo secundario', 'Un paso a la vez', 'Recuperar la sensación de control']
      },
      {
        letter: 'D',
        title: 'Derivación a Redes',
        badge: 'PASO 4',
        desc: 'Conectar a la persona con su red vincular significativa, servicios médicos de urgencia o profesionales de salud mental.',
        claves: ['Familiares y red de contención', 'Dispositivos de emergencia locales', 'Acompañar sin asumir rol clínico']
      },
      {
        letter: 'E',
        title: 'Psicoeducación',
        badge: 'PASO 5',
        desc: 'Normalizar las respuestas agudas de estrés y brindar pautas claras de autocuidado para los días posteriores al evento.',
        claves: ['El malestar agudo es esperable', 'Higiene del sueño y alimentación', 'Señales de alarma para re-consultar']
      }
    ]

    const cardW = 212
    const cardH = 380
    const gap = 15
    const leftMargin = 40

    steps.forEach((step, i) => {
      const x = leftMargin + i * (cardW + gap)
      const y = startY

      // Sombra sutil / fondo
      doc.rect(x, y, cardW, cardH).fillAndStroke(C.crema, C.grisCalido)
      doc.rect(x, y, cardW, 46).fill(C.marca)

      // Círculo con la letra
      doc.circle(x + 32, y + 23, 16).fill(C.tinta)
      doc.fillColor(C.blanco).font('Heading-Bold').fontSize(14)
      doc.text(step.letter, x + 25, y + 15, { lineBreak: false })

      // Badge y título en cabecera
      doc.fillColor(C.grisCalido).font('Heading-SemiBold').fontSize(7.5)
      doc.text(step.badge, x + 56, y + 12, { lineBreak: false })
      doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(10)
      doc.text(step.title, x + 56, y + 23, { width: cardW - 62, lineBreak: false })

      // Descripción
      doc.fillColor(C.tinta).font('Body').fontSize(8.8)
      doc.text(step.desc, x + 12, y + 58, { width: cardW - 24, lineGap: 1.8 })

      // Separador
      const sepY = y + 180
      doc.moveTo(x + 12, sepY).lineTo(x + cardW - 12, sepY).lineWidth(0.5).strokeColor(C.grisCalido).stroke()

      // Claves prácticas
      doc.fillColor(C.marca).font('Heading-SemiBold').fontSize(8)
      doc.text('CLAVES PRÁCTICAS:', x + 12, sepY + 10)

      let cy = sepY + 26
      step.claves.forEach((c) => {
        doc.rect(x + 14, cy + 3, 4, 4).fill(C.marca)
        doc.fillColor(C.tinta).font('Body-Medium').fontSize(8.2)
        doc.text(c, x + 24, cy, { width: cardW - 38, lineGap: 1.5 })
        cy = doc.y + 6
      })

      // Flecha conectora entre tarjetas
      if (i < steps.length - 1) {
        const arrowX = x + cardW + 3
        const arrowY = y + 23
        doc.moveTo(arrowX, arrowY - 4).lineTo(arrowX + 8, arrowY).lineTo(arrowX, arrowY + 4).lineWidth(1.5).strokeColor(C.marca).stroke()
      }
    })

    // Callout inferior de advertencia
    const botY = startY + cardH + 20
    doc.rect(40, botY, 1120, 52).fill('#f8f9fa')
    doc.rect(40, botY, 4, 52).fill(C.marca)
    doc.fillColor(C.tinta).font('Heading-SemiBold').fontSize(8.5)
    doc.text('CRITERIO ÉTICO FUNDAMENTAL:', 54, botY + 10)
    doc.font('Body').fontSize(8.5).fillColor(C.mutedFg)
    doc.text('Los Primeros Auxilios Psicológicos NO son psicoterapia ni tratamiento clínico. Su función es la estabilización temporal y la conexión con recursos especializados. Ante sospecha de riesgo suicida o cuadro psicótico, activar la derivación inmediata a servicios de salud mental.', 54, botY + 24, { width: 1090, lineGap: 1.6 })

    drawInfografiaFooter(doc)

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

// 2. INFOGRAFÍA MODELO TREC
function generarInfografiaTrec() {
  return new Promise((resolve, reject) => {
    const outPath = path.join(OUT_DIR, 'infografia-trec-modelo-cognitivo.pdf')
    const doc = new PDFDocument({ size: [1200, 750], margins: { top: 0, bottom: 0, left: 0, right: 0 } })
    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)
    registerFonts(doc)

    drawInfografiaHeader(
      doc,
      'El Modelo ABCDE de la TREC en el Liderazgo Pastoral',
      'Esquema de reestructuración cognitiva: de las exigencias rígidas al discernimiento flexible y saludable',
      'Módulo 2 · Terapia Racional Emotiva Conductual'
    )

    const startY = doc.y + 10

    const items = [
      {
        letra: 'A',
        title: 'Acontecimiento',
        subtitle: 'Activating Event',
        color: C.tinta,
        desc: 'El hecho objetivo e incuestionable que ocurre en la realidad externa.',
        ejemplo: 'Ejemplo: Un feligrés deja de asistir a la congregación o critica una predicación del líder.'
      },
      {
        letra: 'B',
        title: 'Creencias (Beliefs)',
        subtitle: 'Filtro Cognitivo',
        color: C.marca,
        desc: 'Las convicciones, interpretaciones y demandas que el líder aplica al acontecimiento.',
        ejemplo: '• Racional: “Preferiría que esto no ocurriera, pero puedo afrontarlo y aprender”. \n• Irracional: “Debo agradar a todos; si alguien se va, soy un completo fracaso”.'
      },
      {
        letra: 'C',
        title: 'Consecuencias',
        subtitle: 'Emoción y Conducta',
        color: C.rojo,
        desc: 'Las emociones resultantes del sistema de creencias, no del hecho en sí.',
        ejemplo: '• De B Racional: Tristeza saludable, reflexión, diálogo empático. \n• De B Irracional: Culpa destructiva, burnout, aislamiento ministerial o enojo.'
      },
      {
        letra: 'D',
        title: 'Debate Socrático',
        subtitle: 'Disputing',
        color: C.verde,
        desc: 'El cuestionamiento activo de la rigidez cognitiva mediante preguntas reflexivas.',
        ejemplo: '¿Qué evidencia respalda que debo ser perfecto? ¿Me ayuda esta exigencia a servir mejor o me agota?'
      },
      {
        letra: 'E',
        title: 'Efecto Adaptativo',
        subtitle: 'Effective Philosophy',
        color: C.tinta,
        desc: 'Una nueva filosofía pastoral basada en la gracia, los límites saludables y la compasión.',
        ejemplo: 'Aceptar que la respuesta de otros no determina el valor esencial ni la vocación del líder.'
      }
    ]

    const cardW = 212
    const cardH = 380
    const gap = 15
    const leftMargin = 40

    items.forEach((item, i) => {
      const x = leftMargin + i * (cardW + gap)
      const y = startY

      doc.rect(x, y, cardW, cardH).fillAndStroke(C.crema, C.grisCalido)
      doc.rect(x, y, cardW, 46).fill(item.color)

      doc.circle(x + 32, y + 23, 16).fill(C.blanco)
      doc.fillColor(item.color).font('Heading-Bold').fontSize(14)
      doc.text(item.letra, x + 25, y + 15, { lineBreak: false })

      doc.fillColor(C.grisCalido).font('Heading-SemiBold').fontSize(7.5)
      doc.text(item.subtitle.toUpperCase(), x + 56, y + 12, { lineBreak: false })
      doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(9.5)
      doc.text(item.title, x + 56, y + 23, { width: cardW - 62, lineBreak: false })

      doc.fillColor(C.tinta).font('Body').fontSize(8.8)
      doc.text(item.desc, x + 12, y + 58, { width: cardW - 24, lineGap: 1.8 })

      const sepY = y + 165
      doc.moveTo(x + 12, sepY).lineTo(x + cardW - 12, sepY).lineWidth(0.5).strokeColor(C.grisCalido).stroke()

      doc.fillColor(C.marca).font('Heading-SemiBold').fontSize(8)
      doc.text('ILUSTRACIÓN MINISTERIAL:', x + 12, sepY + 10)

      doc.fillColor(C.tinta).font('Body-Medium').fontSize(8.2)
      doc.text(item.ejemplo, x + 12, sepY + 24, { width: cardW - 24, lineGap: 1.5 })

      if (i < items.length - 1) {
        const arrowX = x + cardW + 3
        const arrowY = y + 23
        doc.moveTo(arrowX, arrowY - 4).lineTo(arrowX + 8, arrowY).lineTo(arrowX, arrowY + 4).lineWidth(1.5).strokeColor(C.marca).stroke()
      }
    })

    const botY = startY + cardH + 20
    doc.rect(40, botY, 1120, 52).fill('#f8f9fa')
    doc.rect(40, botY, 4, 52).fill(C.marca)
    doc.fillColor(C.tinta).font('Heading-SemiBold').fontSize(8.5)
    doc.text('PRINCIPIO CENTRAL DE LA TREC (ALBERT ELLIS / EPICTETO):', 54, botY + 10)
    doc.font('Body').fontSize(8.5).fillColor(C.mutedFg)
    doc.text('“No son las cosas que nos suceden las que nos perturban, sino la interpretación que hacemos de ellas”. El sufrimiento pastoral desadaptativo se reduce cuando reemplazamos las exigencias absolutistas por deseos y preferencias saludables.', 54, botY + 24, { width: 1090, lineGap: 1.6 })

    drawInfografiaFooter(doc)

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

async function run() {
  console.log('Generando infografías vectoriales...')
  await generarInfografiaPap()
  console.log('OK -> infografia-pap-protocolo-abcde.pdf')
  await generarInfografiaTrec()
  console.log('OK -> infografia-trec-modelo-cognitivo.pdf')
}

run().catch((err) => {
  console.error('Error generando infografías:', err)
  process.exit(1)
})
