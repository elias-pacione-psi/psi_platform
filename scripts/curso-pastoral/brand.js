const path = require('path')

const C = {
  tinta: '2f3e46',
  marca: '4e6478',
  crema: 'f1f0eb',
  blanco: 'ffffff',
  grisCalido: 'd6dee5',
  mutedFg: '5f6d77',
  cardBg: 'faf9f6',
}

const FONT_HEAD = 'Poppins'
const FONT_BODY = 'Poppins'
const FONT_SERIF = 'Lora'

const ASSETS = __dirname
const MARK_CREMA = path.join(ASSETS, 'mark-crema.png')
const MARK_TINTA = path.join(ASSETS, 'mark-tinta.png')

const PAGE_W = 13.333
const PAGE_H = 7.5
const MARGIN = 0.55
const CONTENT_W = PAGE_W - MARGIN * 2

function setup(pres) {
  pres.defineLayout({ name: 'BRAND_WIDE', width: PAGE_W, height: PAGE_H })
  pres.layout = 'BRAND_WIDE'
}

// Cabecera de marca (igual a la de los PDF: barra tinta + isotipo + wordmark) + título de
// la diapositiva debajo. Se llama al principio de cada slide de contenido.
function chrome(slide, { curso, leccion }) {
  slide.background = { color: C.crema }
  const barH = 0.62
  slide.addShape('rect', { x: 0, y: 0, w: PAGE_W, h: barH, fill: { color: C.tinta }, line: { type: 'none' } })
  slide.addImage({ path: MARK_CREMA, x: 0.3, y: 0.14, w: 0.34, h: 0.34 })
  slide.addText('ELIAS PACIONE', { x: 0.74, y: 0.08, w: 4, h: 0.24, fontFace: FONT_HEAD, fontSize: 11, bold: true, color: C.blanco, margin: 0 })
  slide.addText('Psicología con sentido', { x: 0.74, y: 0.32, w: 4, h: 0.2, fontFace: FONT_BODY, fontSize: 8, color: C.grisCalido, margin: 0 })
  if (curso) {
    slide.addText(curso, { x: PAGE_W - 5.3, y: 0.08, w: 4.75, h: 0.24, fontFace: FONT_HEAD, fontSize: 10, bold: true, color: C.blanco, align: 'right', margin: 0 })
  }
  if (leccion) {
    slide.addText(leccion, { x: PAGE_W - 5.3, y: 0.32, w: 4.75, h: 0.2, fontFace: FONT_BODY, fontSize: 8, color: C.grisCalido, align: 'right', margin: 0 })
  }
  // pie de página
  slide.addShape('line', { x: MARGIN, y: PAGE_H - 0.32, w: CONTENT_W, h: 0, line: { color: C.grisCalido, width: 0.75 } })
  slide.addText('Material educativo de la plataforma de Elías Pacione', { x: MARGIN, y: PAGE_H - 0.28, w: 6, h: 0.22, fontFace: FONT_BODY, fontSize: 8, color: C.mutedFg, margin: 0 })
}

function slideTitle(slide, titulo, { y = 0.86, fontSize = 24, width = CONTENT_W } = {}) {
  slide.addText(titulo, {
    x: MARGIN, y, w: width, h: 0.9,
    fontFace: FONT_HEAD, fontSize, bold: true, color: C.tinta, align: 'left', valign: 'top', margin: 0, lineSpacingMultiple: 1.05,
  })
}

function titleSlide(pres, { curso, subtitulo, tag }) {
  const slide = pres.addSlide()
  slide.background = { color: C.tinta }
  slide.addImage({ path: MARK_CREMA, x: 0.7, y: 0.7, w: 0.6, h: 0.6 })
  slide.addText('ELIAS PACIONE', { x: 1.45, y: 0.72, w: 5, h: 0.3, fontFace: FONT_HEAD, fontSize: 14, bold: true, color: C.blanco, margin: 0 })
  slide.addText('Psicología con sentido', { x: 1.45, y: 1.02, w: 5, h: 0.26, fontFace: FONT_BODY, fontSize: 10, color: C.grisCalido, margin: 0 })

  if (tag) {
    slide.addText(tag.toUpperCase(), {
      x: 0.9, y: 2.55, w: CONTENT_W, h: 0.35, fontFace: FONT_HEAD, fontSize: 13, bold: true, color: C.grisCalido, charSpacing: 2, margin: 0,
    })
  }
  slide.addText(curso, {
    x: 0.85, y: 2.95, w: PAGE_W - 1.7, h: 1.7, fontFace: FONT_HEAD, fontSize: 40, bold: true, color: C.blanco, margin: 0, lineSpacingMultiple: 1.05,
  })
  slide.addText(subtitulo, {
    x: 0.9, y: 4.5, w: PAGE_W - 2.2, h: 0.9, fontFace: FONT_SERIF, italic: true, fontSize: 17, color: C.grisCalido, margin: 0, lineSpacingMultiple: 1.15,
  })
  slide.addShape('line', { x: 0.9, y: 6.55, w: 1.1, h: 0, line: { color: C.marca, width: 3 } })
  slide.addText('Resumen visual del curso · Elías Pacione', { x: 0.9, y: 6.7, w: 6, h: 0.3, fontFace: FONT_BODY, fontSize: 10.5, color: C.grisCalido, margin: 0 })
  return slide
}

function badge(slide, { x, y, size = 0.34, text, fill = C.marca, color = C.blanco, fontSize = 12 }) {
  slide.addShape('ellipse', { x, y, w: size, h: size, fill: { color: fill }, line: { type: 'none' } })
  slide.addText(String(text), { x, y: y - 0.01, w: size, h: size, align: 'center', valign: 'middle', fontFace: FONT_HEAD, bold: true, fontSize, color, margin: 0 })
}

// Fila de N tarjetas (3 a 5) con badge numerado, título y cuerpo (string o array de bullets).
function cardRow(slide, cards, { y = 1.95, h = 4.55 } = {}) {
  const n = cards.length
  const gap = 0.22
  const w = (CONTENT_W - gap * (n - 1)) / n
  cards.forEach((card, i) => {
    const x = MARGIN + i * (w + gap)
    const fillColor = card.fill || C.blanco
    slide.addShape('roundRect', {
      x, y, w, h, rectRadius: 0.09,
      fill: { color: fillColor }, line: { type: 'none' },
      shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 6, offset: 2, angle: 90 },
    })
    let cy = y + 0.24
    if (card.badge !== undefined) {
      badge(slide, { x: x + 0.24, y: cy, text: card.badge, fill: card.badgeFill || C.marca, color: card.badgeColor || C.blanco })
      cy += 0.5
    }
    if (card.eyebrow) {
      slide.addText(card.eyebrow.toUpperCase(), { x: x + 0.24, y: cy, w: w - 0.48, h: 0.24, fontFace: FONT_HEAD, bold: true, fontSize: 9, color: card.textColor ? tint(card.textColor) : C.marca, charSpacing: 0.5, margin: 0 })
      cy += 0.28
    }
    slide.addText(card.title, { x: x + 0.24, y: cy, w: w - 0.48, h: 0.6, fontFace: FONT_HEAD, bold: true, fontSize: card.titleSize || 14, color: card.textColor || C.tinta, margin: 0, lineSpacingMultiple: 1.05 })
    cy += card.titleGap || 0.56
    if (Array.isArray(card.body)) {
      const opts = card.body.map((t, i2) => ({ text: t, options: { bullet: { code: '25AA', indent: 12 }, breakLine: i2 < card.body.length - 1, color: card.bodyColor || C.mutedFg, fontSize: card.bodySize || 10.5, fontFace: FONT_BODY, paraSpaceAfter: 6 } }))
      slide.addText(opts, { x: x + 0.24, y: cy, w: w - 0.48, h: y + h - cy - 0.2, fontFace: FONT_BODY, margin: 0, valign: 'top' })
    } else if (card.body) {
      slide.addText(card.body, { x: x + 0.24, y: cy, w: w - 0.48, h: y + h - cy - 0.2, fontFace: FONT_BODY, fontSize: card.bodySize || 10.5, color: card.bodyColor || C.mutedFg, margin: 0, valign: 'top', lineSpacingMultiple: 1.15 })
    }
  })
}

// Grilla compacta de N chips (título + descripción corta), con badge numerado.
function grid(slide, items, { y = 1.9, h = 5.05, cols = 3 } = {}) {
  const rows = Math.ceil(items.length / cols)
  const gap = 0.18
  const cw = (CONTENT_W - gap * (cols - 1)) / cols
  const chH = (h - gap * (rows - 1)) / rows
  items.forEach((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = MARGIN + col * (cw + gap)
    const yy = y + row * (chH + gap)
    slide.addShape('roundRect', {
      x, y: yy, w: cw, h: chH, rectRadius: 0.08,
      fill: { color: C.blanco }, line: { color: C.grisCalido, width: 0.75 },
    })
    badge(slide, { x: x + 0.16, y: yy + chH / 2 - 0.17, size: 0.34, text: item.badge ?? i + 1, fontSize: 11 })
    const textX = x + 0.62
    const textW = cw - 0.62 - 0.16
    slide.addText(
      [
        { text: item.title, options: { bold: true, fontSize: item.titleSize || 11.5, color: C.tinta, breakLine: true, fontFace: FONT_HEAD } },
        ...(item.desc ? [{ text: item.desc, options: { fontSize: item.descSize || 9, color: C.mutedFg, fontFace: FONT_BODY } }] : []),
      ],
      { x: textX, y: yy, w: textW, h: chH, valign: 'middle', margin: 0, lineSpacingMultiple: 1.05 }
    )
  })
}

// Comparación de 2 columnas (título + bullets cada una).
function twoColumn(slide, { left, right, y = 1.95, h = 4.55 }) {
  const gap = 0.3
  const w = (CONTENT_W - gap) / 2
  ;[{ col: left, x: MARGIN }, { col: right, x: MARGIN + w + gap }].forEach(({ col, x }) => {
    slide.addShape('roundRect', {
      x, y, w, h, rectRadius: 0.1,
      fill: { color: col.fill || C.blanco }, line: { type: 'none' },
      shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 6, offset: 2, angle: 90 },
    })
    slide.addShape('roundRect', { x: x + 0.28, y: y + 0.26, w: 0.5, h: 0.5, rectRadius: 0.1, fill: { color: col.badgeFill || C.marca }, line: { type: 'none' } })
    slide.addText(col.icon || '', { x: x + 0.28, y: y + 0.26, w: 0.5, h: 0.5, align: 'center', valign: 'middle', fontSize: 20, color: C.blanco, bold: true, margin: 0 })
    slide.addText(col.title, { x: x + 0.94, y: y + 0.3, w: w - 1.2, h: 0.5, fontFace: FONT_HEAD, bold: true, fontSize: 15, color: col.titleColor || C.tinta, margin: 0, valign: 'middle' })
    const bulletOpts = col.items.map((t, i2) => ({ text: t, options: { bullet: { code: '25AA', indent: 14 }, breakLine: i2 < col.items.length - 1, color: C.mutedFg, fontSize: 11, fontFace: FONT_BODY, paraSpaceAfter: 10 } }))
    slide.addText(bulletOpts, { x: x + 0.32, y: y + 1.0, w: w - 0.64, h: h - 1.25, fontFace: FONT_BODY, margin: 0, valign: 'top' })
  })
}

// Flujo horizontal de N pasos numerados conectados por flechas (ciclos, secuencias).
function processFlow(slide, steps, { y = 2.6, h = 2.5, circular = false } = {}) {
  const n = steps.length
  const gap = 0.5
  const w = (CONTENT_W - gap * (n - 1)) / n
  const midY = y + h / 2
  steps.forEach((step, i) => {
    const x = MARGIN + i * (w + gap)
    if (i < n - 1) {
      slide.addShape('rightArrow', { x: x + w, y: midY - 0.12, w: gap, h: 0.24, fill: { color: C.grisCalido }, line: { type: 'none' } })
    }
    slide.addShape('roundRect', {
      x, y, w, h, rectRadius: 0.09,
      fill: { color: C.blanco }, line: { type: 'none' },
      shadow: { type: 'outer', color: '000000', opacity: 0.18, blur: 6, offset: 2, angle: 90 },
    })
    badge(slide, { x: x + w / 2 - 0.22, y: y + 0.24, size: 0.44, text: i + 1, fontSize: 15 })
    slide.addText(step.title, { x: x + 0.18, y: y + 0.82, w: w - 0.36, h: 0.6, align: 'center', fontFace: FONT_HEAD, bold: true, fontSize: 12.5, color: C.tinta, margin: 0, lineSpacingMultiple: 1.05 })
    slide.addText(step.desc, { x: x + 0.18, y: y + 1.4, w: w - 0.36, h: h - 1.55, align: 'center', fontFace: FONT_BODY, fontSize: 9.5, color: C.mutedFg, margin: 0, valign: 'top', lineSpacingMultiple: 1.1 })
  })
  if (circular) {
    slide.addText('el ciclo se retroalimenta: el paso 4 refuerza al paso 1', {
      x: MARGIN, y: y + h + 0.18, w: CONTENT_W, h: 0.3, align: 'center', italic: true, fontFace: FONT_SERIF, fontSize: 11, color: C.mutedFg, margin: 0,
    })
  }
}

// 3 tarjetas de fase/etapa (planes de N días, niveles de intervención).
function phaseTimeline(slide, phases, { y = 1.95, h = 4.55 } = {}) {
  const n = phases.length
  const gap = 0.28
  const w = (CONTENT_W - gap * (n - 1)) / n
  phases.forEach((phase, i) => {
    const x = MARGIN + i * (w + gap)
    slide.addShape('roundRect', { x, y, w, h: 0.62, rectRadius: 0.09, fill: { color: C.tinta }, line: { type: 'none' } })
    slide.addText(phase.rango, { x: x + 0.2, y, w: w - 0.4, h: 0.62, align: 'left', valign: 'middle', fontFace: FONT_HEAD, bold: true, fontSize: 12.5, color: C.blanco, margin: 0 })
    slide.addShape('roundRect', {
      x, y: y + 0.62, w, h: h - 0.62, rectRadius: 0, fill: { color: C.blanco }, line: { type: 'none' },
      shadow: { type: 'outer', color: '000000', opacity: 0.15, blur: 5, offset: 2, angle: 90 },
    })
    slide.addText(phase.titulo, { x: x + 0.2, y: y + 0.8, w: w - 0.4, h: 0.55, fontFace: FONT_HEAD, bold: true, fontSize: 13, color: C.marca, margin: 0, lineSpacingMultiple: 1.05 })
    const bulletOpts = phase.items.map((t, i2) => ({ text: t, options: { bullet: { code: '25AA', indent: 12 }, breakLine: i2 < phase.items.length - 1, color: C.mutedFg, fontSize: 10, fontFace: FONT_BODY, paraSpaceAfter: 8 } }))
    slide.addText(bulletOpts, { x: x + 0.24, y: y + 1.42, w: w - 0.48, h: h - 1.6, fontFace: FONT_BODY, margin: 0, valign: 'top' })
  })
}

function tint(hex) {
  return hex // placeholder simple, se puede ampliar si hace falta un tono más claro
}

module.exports = { C, FONT_HEAD, FONT_BODY, FONT_SERIF, PAGE_W, PAGE_H, MARGIN, CONTENT_W, setup, chrome, slideTitle, titleSlide, cardRow, grid, twoColumn, processFlow, phaseTimeline, badge }
