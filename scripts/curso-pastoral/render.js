const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const FONTS = path.join(__dirname, 'fonts')
const ASSETS = __dirname

// Paleta exacta de la plataforma (src/app/globals.css / EmailLayout.tsx)
const C = {
  tinta: '#2f3e46',
  marca: '#4e6478',
  crema: '#f1f0eb',
  blanco: '#ffffff',
  grisCalido: '#d6dee5',
  mutedFg: '#5f6d77',
  verdeAcento: '#3a7d44',
}

// Márgenes ajustados sobre A4 (595.28 x 841.89 pt) según punto 4.3 del pipeline
const PAGE = { size: 'A4', margins: { top: 74, bottom: 52, left: 52, right: 52 } }
const CONTENT_W = 595.28 - PAGE.margins.left - PAGE.margins.right

function registerFonts(doc) {
  doc.registerFont('Heading-Bold', path.join(FONTS, 'Poppins-Bold.ttf'))
  doc.registerFont('Heading-SemiBold', path.join(FONTS, 'Poppins-SemiBold.ttf'))
  doc.registerFont('Heading-Medium', path.join(FONTS, 'Poppins-Medium.ttf'))
  doc.registerFont('Body', path.join(FONTS, 'Poppins-Regular.ttf'))
  doc.registerFont('Body-Medium', path.join(FONTS, 'Poppins-Medium.ttf'))
  doc.registerFont('Serif-Italic', path.join(FONTS, 'Lora-Italic.ttf'))
}

function drawHeader(doc, meta) {
  const w = doc.page.width
  const barH = 58
  doc.save()
  doc.rect(0, 0, w, barH).fill(C.tinta)

  // Logo mark crema recoloreado
  const markW = 28
  const markH = 18
  const markY = (barH - markH) / 2
  const markPath = path.join(ASSETS, 'mark-crema.png')
  if (fs.existsSync(markPath)) {
    doc.opacity(0.95).image(markPath, PAGE.margins.left, markY, { width: markW, height: markH })
    doc.opacity(1)
  }

  // Wordmark ELIAS PACIONE sin tilde en mayúsculas (regla estricta de marca)
  doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(11)
  doc.text('ELIAS PACIONE', PAGE.margins.left + markW + 10, 16, { lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(7.5)
  doc.text('Psicología con sentido', PAGE.margins.left + markW + 10, 31, { lineBreak: false })

  // Derecha: curso + tema/lección
  const rightW = 280
  doc.fillColor(C.blanco).font('Heading-Medium').fontSize(8.5)
  doc.text(meta.cursoTitulo, w - PAGE.margins.right - rightW, 16, { width: rightW, align: 'right', lineBreak: false })
  doc.fillColor(C.grisCalido).font('Body').fontSize(7.5)
  doc.text(meta.leccionEtiqueta, w - PAGE.margins.right - rightW, 31, { width: rightW, align: 'right', lineBreak: false })

  doc.restore()
}

function drawFooter(doc, meta) {
  const w = doc.page.width
  const h = doc.page.height
  const y = h - 46

  // Importante: bajamos doc.page.margins.bottom = 0 para que pdfkit no dispare una nueva página
  const savedBottom = doc.page.margins.bottom
  doc.page.margins.bottom = 0

  doc.save()
  doc.moveTo(PAGE.margins.left, y).lineTo(w - PAGE.margins.right, y).lineWidth(0.6).strokeColor(C.grisCalido).stroke()
  doc.fillColor(C.mutedFg).font('Body').fontSize(7.2)
  doc.text('Material educativo de la plataforma de Elías Pacione · uso personal, no reproducir sin autorización.', PAGE.margins.left, y + 8, { width: 370, lineBreak: false })
  doc.font('Body-Medium').fontSize(7.2)
  const pageLabel = `Página ${doc._pageNumber || ''}`
  doc.text(pageLabel, w - PAGE.margins.right - 90, y + 8, { width: 90, align: 'right', lineBreak: false })
  doc.restore()

  doc.page.margins.bottom = savedBottom
}

function ensureSpace(doc, meta, needed) {
  const bottomLimit = doc.page.height - PAGE.margins.bottom
  if (doc.y + needed > bottomLimit) {
    doc.addPage()
  }
}

// ---- Bloques tipados ----

function renderH1(doc, meta, text) {
  ensureSpace(doc, meta, 45)
  doc.moveDown(0.4)
  doc.font('Heading-Bold').fontSize(17).fillColor(C.tinta)
  doc.text(text, PAGE.margins.left, doc.y, { width: CONTENT_W })
  const ruleY = doc.y + 4
  doc.moveTo(PAGE.margins.left, ruleY).lineTo(PAGE.margins.left + 50, ruleY).lineWidth(2.5).strokeColor(C.marca).stroke()
  doc.y = ruleY + 14
}

function renderH2(doc, meta, text) {
  ensureSpace(doc, meta, 30)
  doc.moveDown(0.45)
  const startY = doc.y
  doc.font('Heading-SemiBold').fontSize(12.5).fillColor(C.tinta)
  const textX = PAGE.margins.left + 10
  doc.text(text, textX, startY, { width: CONTENT_W - 10 })
  const endY = doc.y
  doc.rect(PAGE.margins.left, startY + 1, 3.5, Math.max(endY - startY, 12)).fill(C.marca)
  doc.y = endY + 6
}

function renderH3(doc, meta, text) {
  ensureSpace(doc, meta, 28)
  doc.moveDown(0.4)
  doc.font('Heading-SemiBold').fontSize(10.5).fillColor(C.marca)
  doc.text(text, PAGE.margins.left, doc.y, { width: CONTENT_W })
  doc.moveDown(0.25)
}

function renderP(doc, meta, text) {
  doc.font('Body').fontSize(9.5).fillColor(C.tinta)
  const height = doc.heightOfString(text, { width: CONTENT_W, lineGap: 1.8 })
  ensureSpace(doc, meta, Math.min(height, 80))
  doc.text(text, PAGE.margins.left, doc.y, { width: CONTENT_W, lineGap: 1.8, align: 'justify' })
  doc.moveDown(0.22)
}

function renderQuote(doc, meta, text, author) {
  doc.font('Serif-Italic').fontSize(11)
  const textW = CONTENT_W - 24
  const th = doc.heightOfString(`“${text}”`, { width: textW, lineGap: 2 })
  const authorH = author ? 14 : 0
  const boxH = th + authorH + 18
  ensureSpace(doc, meta, boxH + 8)
  const startY = doc.y
  doc.rect(PAGE.margins.left, startY, CONTENT_W, boxH).fill(C.crema)
  doc.rect(PAGE.margins.left, startY, 3.5, boxH).fill(C.marca)
  doc.fillColor(C.tinta).font('Serif-Italic').fontSize(11)
  doc.text(`“${text}”`, PAGE.margins.left + 16, startY + 9, { width: textW, lineGap: 2 })
  if (author) {
    doc.font('Body-Medium').fontSize(8).fillColor(C.marca)
    doc.text(`— ${author}`, PAGE.margins.left + 16, startY + boxH - 16, { width: textW })
  }
  doc.y = startY + boxH + 10
}

function renderCallout(doc, meta, block) {
  const isStat = block.kind === 'stat'
  const isWarning = block.kind === 'warning'
  const labelText = (block.label || (isWarning ? 'AVISO IMPORTANTE' : isStat ? 'DATO CLAVE' : 'NOTA')).toUpperCase()
  const padX = 14
  const padY = 10
  const innerW = CONTENT_W - padX * 2 - 4
  doc.font('Heading-SemiBold').fontSize(8)
  const labelH = labelText ? 13 : 0
  doc.font('Body').fontSize(9)
  const textH = doc.heightOfString(block.text, { width: innerW, lineGap: 1.8 })
  const sourceH = block.source ? 12 : 0
  const boxH = labelH + textH + sourceH + padY * 2
  ensureSpace(doc, meta, boxH + 8)
  const startY = doc.y
  const bg = isWarning ? '#faede8' : isStat ? '#e8edf2' : C.crema
  const barColor = isWarning ? '#c44536' : isStat ? C.marca : C.tinta
  doc.rect(PAGE.margins.left, startY, CONTENT_W, boxH).fill(bg)
  doc.rect(PAGE.margins.left, startY, 3.5, boxH).fill(barColor)
  let cy = startY + padY
  if (labelText) {
    doc.font('Heading-SemiBold').fontSize(8).fillColor(barColor)
    doc.text(labelText, PAGE.margins.left + padX + 4, cy, { width: innerW, characterSpacing: 0.3 })
    cy = doc.y + 2
  }
  doc.font('Body').fontSize(9).fillColor(C.tinta)
  doc.text(block.text, PAGE.margins.left + padX + 4, cy, { width: innerW, lineGap: 1.8 })
  cy = doc.y
  if (block.source) {
    doc.font('Serif-Italic').fontSize(7.5).fillColor(C.mutedFg)
    doc.text(`— ${block.source}`, PAGE.margins.left + padX + 4, cy + 2, { width: innerW })
  }
  doc.y = startY + boxH + 10
}

function renderBullets(doc, meta, items) {
  doc.font('Body').fontSize(9.5).fillColor(C.tinta)
  for (const item of items) {
    const w = CONTENT_W - 14
    const h = doc.heightOfString(item, { width: w, lineGap: 1.8 })
    ensureSpace(doc, meta, h + 3)
    const y = doc.y
    doc.fillColor(C.marca)
    doc.rect(PAGE.margins.left + 2, y + 4, 4, 4).fill(C.marca)
    doc.fillColor(C.tinta).font('Body').fontSize(9.5)
    doc.text(item, PAGE.margins.left + 14, y, { width: w, lineGap: 1.8 })
    doc.moveDown(0.2)
  }
  doc.moveDown(0.25)
}

function renderNumbered(doc, meta, items) {
  items.forEach((item, i) => {
    const num = `${i + 1}.`
    const numW = 18
    const w = CONTENT_W - numW
    doc.font('Body').fontSize(9.5)
    const h = doc.heightOfString(item, { width: w, lineGap: 1.8 })
    ensureSpace(doc, meta, h + 3)
    const y = doc.y
    doc.font('Heading-SemiBold').fontSize(9.5).fillColor(C.marca)
    doc.text(num, PAGE.margins.left, y, { width: numW, lineGap: 1.8 })
    doc.font('Body').fontSize(9.5).fillColor(C.tinta)
    doc.text(item, PAGE.margins.left + numW, y, { width: w, lineGap: 1.8 })
    doc.moveDown(0.2)
  })
  doc.moveDown(0.25)
}

function renderChecklist(doc, meta, items) {
  doc.font('Body').fontSize(9.5).fillColor(C.tinta)
  for (const item of items) {
    const w = CONTENT_W - 18
    const h = doc.heightOfString(item, { width: w, lineGap: 1.8 })
    ensureSpace(doc, meta, h + 3)
    const y = doc.y
    doc.rect(PAGE.margins.left + 1, y + 2, 7, 7).lineWidth(0.8).strokeColor(C.marca).stroke()
    doc.fillColor(C.tinta).font('Body').fontSize(9.5)
    doc.text(item, PAGE.margins.left + 18, y, { width: w, lineGap: 1.8 })
    doc.moveDown(0.2)
  }
  doc.moveDown(0.25)
}

function colWidths(n) {
  if (n === 2) return [0.35, 0.65]
  if (n === 3) return [0.24, 0.38, 0.38]
  if (n === 4) return [0.22, 0.26, 0.26, 0.26]
  const eq = 1 / n
  return new Array(n).fill(eq)
}

function renderTable(doc, meta, headers, rows) {
  const n = headers.length
  const ratios = colWidths(n)
  const widths = ratios.map((r) => r * CONTENT_W)
  const cellPadX = 6
  const cellPadY = 4

  function rowHeight(cells, font, size) {
    doc.font(font).fontSize(size)
    let max = 0
    cells.forEach((cell, i) => {
      const h = doc.heightOfString(String(cell), { width: widths[i] - cellPadX * 2, lineGap: 1.4 })
      if (h > max) max = h
    })
    return max + cellPadY * 2
  }

  const headerH = rowHeight(headers, 'Heading-SemiBold', 8)
  let totalTableH = headerH
  rows.forEach((r) => {
    totalTableH += rowHeight(r, 'Body', 8.2)
  })

  const remaining = doc.page.height - PAGE.margins.bottom - doc.y
  if (totalTableH > remaining && totalTableH < (doc.page.height - PAGE.margins.top - PAGE.margins.bottom)) {
    doc.addPage()
  }

  function drawHeaderRow() {
    const h = rowHeight(headers, 'Heading-SemiBold', 8)
    ensureSpace(doc, meta, h + 15)
    const y = doc.y
    doc.rect(PAGE.margins.left, y, CONTENT_W, h).fill(C.tinta)
    let x = PAGE.margins.left
    headers.forEach((text, i) => {
      doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(8)
      doc.text(text, x + cellPadX, y + cellPadY, { width: widths[i] - cellPadX * 2, lineGap: 1.4 })
      x += widths[i]
    })
    doc.y = y + h
  }

  drawHeaderRow()

  rows.forEach((cells, ri) => {
    const h = rowHeight(cells, 'Body', 8.2)
    if (doc.y + h > doc.page.height - PAGE.margins.bottom) {
      doc.addPage()
      drawHeaderRow()
    }
    const y = doc.y
    const bg = ri % 2 === 0 ? C.blanco : '#f6f5f0'
    doc.rect(PAGE.margins.left, y, CONTENT_W, h).fill(bg)
    let x = PAGE.margins.left
    cells.forEach((text, i) => {
      doc.fillColor(C.tinta).font('Body').fontSize(8.2)
      doc.text(String(text), x + cellPadX, y + cellPadY, { width: widths[i] - cellPadX * 2, lineGap: 1.4 })
      x += widths[i]
    })
    doc.moveTo(PAGE.margins.left, y + h).lineTo(PAGE.margins.left + CONTENT_W, y + h).lineWidth(0.4).strokeColor(C.grisCalido).stroke()
    doc.y = y + h
  })
  doc.moveDown(0.4)
}

function renderWorkbox(doc, meta, block) {
  const padX = 14
  const padY = 10
  const innerW = CONTENT_W - padX * 2

  doc.font('Heading-Bold').fontSize(10.5)
  const titleH = doc.heightOfString(block.title, { width: innerW })
  doc.font('Body').fontSize(9)
  const introH = block.intro ? doc.heightOfString(block.intro, { width: innerW, lineGap: 1.8 }) + 6 : 0

  let stepsH = 0
  block.steps.forEach(([stepTitle, stepText]) => {
    doc.font('Heading-SemiBold').fontSize(9)
    const numW = 18
    const tW = innerW - numW
    const th = doc.heightOfString(stepTitle, { width: tW, lineGap: 1.4 })
    doc.font('Body').fontSize(8.8)
    const bh = doc.heightOfString(stepText, { width: tW, lineGap: 1.4 })
    stepsH += th + bh + 5
  })

  const headerBarH = 22
  const totalH = headerBarH + padY + titleH + introH + stepsH + padY

  const remaining = doc.page.height - PAGE.margins.bottom - doc.y
  if (totalH > remaining && totalH < doc.page.height - PAGE.margins.top - PAGE.margins.bottom) {
    doc.addPage()
  }
  ensureSpace(doc, meta, 35)

  const startY = doc.y
  doc.rect(PAGE.margins.left, startY, CONTENT_W, totalH).fillAndStroke(C.crema, C.grisCalido)
  doc.rect(PAGE.margins.left, startY, CONTENT_W, headerBarH).fill(C.marca)
  doc.fillColor(C.blanco).font('Heading-SemiBold').fontSize(8.5)
  doc.text(`  ${(block.label || 'ACTIVIDAD GUIADA').toUpperCase()}`, PAGE.margins.left + 4, startY + 6, { width: CONTENT_W - 8, lineBreak: false })

  let cy = startY + headerBarH + padY
  doc.font('Heading-Bold').fontSize(10.5).fillColor(C.tinta)
  doc.text(block.title, PAGE.margins.left + padX, cy, { width: innerW })
  cy = doc.y + (block.intro ? 5 : 0)

  if (block.intro) {
    doc.font('Body').fontSize(9).fillColor(C.mutedFg)
    doc.text(block.intro, PAGE.margins.left + padX, cy, { width: innerW, lineGap: 1.8 })
    cy = doc.y + 6
  }

  block.steps.forEach(([stepTitle, stepText], i) => {
    const numW = 18
    const tW = innerW - numW
    doc.font('Heading-SemiBold').fontSize(9).fillColor(C.marca)
    doc.text(`${i + 1}.`, PAGE.margins.left + padX, cy, { width: numW })
    doc.font('Heading-SemiBold').fontSize(9).fillColor(C.tinta)
    doc.text(stepTitle, PAGE.margins.left + padX + numW, cy, { width: tW, lineGap: 1.4 })
    const ny = doc.y + 1
    doc.font('Body').fontSize(8.8).fillColor(C.tinta)
    doc.text(stepText, PAGE.margins.left + padX + numW, ny, { width: tW, lineGap: 1.4 })
    cy = doc.y + 5
  })

  doc.y = startY + totalH + 10
}

function renderJournal(doc, meta, block) {
  const padX = 14
  const padY = 10
  const innerW = CONTENT_W - padX * 2

  doc.font('Heading-Bold').fontSize(10)
  const titleH = block.title ? doc.heightOfString(block.title, { width: innerW }) + 4 : 0
  const intro = block.intro || 'Esta actividad se resuelve a mano en tu propio cuaderno o bitácora de notas personales. No escribas en este documento.'
  doc.font('Body').fontSize(8.8)
  const introH = doc.heightOfString(intro, { width: innerW, lineGap: 1.6 }) + 8

  let promptsH = 0
  block.prompts.forEach((p, i) => {
    doc.font('Body-Medium').fontSize(8.8)
    promptsH += doc.heightOfString(`${i + 1}. ${p}`, { width: innerW, lineGap: 1.6 }) + 5
  })

  const totalH = padY + titleH + introH + promptsH + padY
  const remaining = doc.page.height - PAGE.margins.bottom - doc.y
  if (totalH > remaining && totalH < doc.page.height - PAGE.margins.top - PAGE.margins.bottom) {
    doc.addPage()
  }
  ensureSpace(doc, meta, 35)

  const startY = doc.y
  doc.rect(PAGE.margins.left, startY, CONTENT_W, totalH).fillAndStroke('#f8f9fa', C.grisCalido)
  doc.rect(PAGE.margins.left, startY, 3.5, totalH).fill(C.marca)

  let cy = startY + padY
  if (block.title) {
    doc.font('Heading-Bold').fontSize(10).fillColor(C.tinta)
    doc.text(block.title.toUpperCase(), PAGE.margins.left + padX, cy, { width: innerW })
    cy = doc.y + 4
  }

  doc.font('Serif-Italic').fontSize(8.8).fillColor(C.mutedFg)
  doc.text(intro, PAGE.margins.left + padX, cy, { width: innerW, lineGap: 1.6 })
  cy = doc.y + 6

  block.prompts.forEach((p, i) => {
    doc.font('Body-Medium').fontSize(8.8).fillColor(C.tinta)
    doc.text(`${i + 1}. ${p}`, PAGE.margins.left + padX, cy, { width: innerW, lineGap: 1.6 })
    cy = doc.y + 4
  })

  doc.y = startY + totalH + 10
}

const RENDERERS = {
  h1: (doc, meta, b) => renderH1(doc, meta, b.text),
  h2: (doc, meta, b) => renderH2(doc, meta, b.text),
  h3: (doc, meta, b) => renderH3(doc, meta, b.text),
  p: (doc, meta, b) => renderP(doc, meta, b.text),
  quote: (doc, meta, b) => renderQuote(doc, meta, b.text, b.author),
  callout: (doc, meta, b) => renderCallout(doc, meta, b),
  bullets: (doc, meta, b) => renderBullets(doc, meta, b.items),
  checklist: (doc, meta, b) => renderChecklist(doc, meta, b.items),
  numbered: (doc, meta, b) => renderNumbered(doc, meta, b.items),
  table: (doc, meta, b) => renderTable(doc, meta, b.headers, b.rows),
  workbox: (doc, meta, b) => renderWorkbox(doc, meta, b),
  journal: (doc, meta, b) => renderJournal(doc, meta, b),
}

function renderPortada(doc, meta, leccion) {
  doc.moveDown(0.4)
  const badgeY = doc.y
  doc.font('Heading-SemiBold').fontSize(8.5).fillColor(C.marca)
  doc.text(`${meta.moduloEtiqueta.toUpperCase()}   ·   TEMA ${leccion.temaNumero || leccion.numero}`, PAGE.margins.left, badgeY, { characterSpacing: 0.5 })
  doc.moveDown(0.4)
  doc.font('Heading-Bold').fontSize(22).fillColor(C.tinta)
  doc.text(leccion.titulo, PAGE.margins.left, doc.y, { width: CONTENT_W })
  if (leccion.subtitulo) {
    doc.moveDown(0.2)
    doc.font('Body').fontSize(11).fillColor(C.mutedFg)
    doc.text(leccion.subtitulo, PAGE.margins.left, doc.y, { width: CONTENT_W })
  }
  const ruleY = doc.y + 8
  doc.moveTo(PAGE.margins.left, ruleY).lineTo(PAGE.margins.left + 75, ruleY).lineWidth(3).strokeColor(C.marca).stroke()
  doc.y = ruleY + 16
}

function generarPdfLeccion(leccion, cursoTitulo, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument(PAGE)
    registerFonts(doc)
    const meta = {
      cursoTitulo,
      moduloEtiqueta: leccion.moduloEtiqueta || 'Curso Pastoral',
      leccionEtiqueta: `${leccion.moduloEtiqueta || 'Módulo'} · Tema ${leccion.temaNumero || leccion.numero}`,
    }

    let pageNumber = 0
    doc.on('pageAdded', () => {
      pageNumber += 1
      doc._pageNumber = pageNumber
      drawHeader(doc, meta)
      drawFooter(doc, meta)
      doc.y = PAGE.margins.top
    })

    const stream = fs.createWriteStream(outPath)
    doc.pipe(stream)

    pageNumber = 1
    doc._pageNumber = 1
    drawHeader(doc, meta)
    drawFooter(doc, meta)
    doc.y = PAGE.margins.top

    renderPortada(doc, meta, leccion)

    let skippedTitleH1 = false
    for (const block of leccion.blocks) {
      if (!skippedTitleH1 && block.type === 'h1' && block.text.toLowerCase().includes(leccion.titulo.toLowerCase())) {
        skippedTitleH1 = true
        continue
      }
      const renderer = RENDERERS[block.type]
      if (!renderer) throw new Error(`Tipo de bloque desconocido: ${block.type}`)
      renderer(doc, meta, block)
    }

    doc.end()
    stream.on('finish', resolve)
    stream.on('error', reject)
  })
}

module.exports = { generarPdfLeccion, C, PAGE, CONTENT_W, registerFonts, drawHeader, drawFooter, RENDERERS, renderPortada, ensureSpace }
