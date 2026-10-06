// Diapositivas del programa "Operador Socioterapéutico": un layout por tipo de contenido,
// todos sobre pptxgenjs y los tokens de marca de scripts/curso-pastoral/brand.js.
//
// Pensado para PROYECTAR en una formación en vivo, no para leer en pantalla:
//   · cuerpo de 15–20 pt (la presentación de la formación pastoral usaba 10–11 pt),
//   · una idea por diapositiva y el desarrollo completo en las NOTAS DEL ORADOR (el .pptx),
//   · mapas conceptuales con frases de enlace entre los conceptos,
//   · "Claves del módulo" al cierre de cada bloque.
// Cada texto se mide con las métricas reales de Poppins/Lora (lib/medir.js) antes de
// escribirse, así que nada se desborda; si algo no entra se avisa en `advertencias`.
const pptxgen = require('pptxgenjs')
const B = require('../../curso-pastoral/brand')
const M = require('./medir')

const { PAGE_W, PAGE_H, MARGIN, CONTENT_W } = B
const C = {
  ...B.C,
  sage: 'a8b79f',
  hondo: '7f95a6',
  hueso: 'f7f6f3',
  tintaSuave: '3b4d56',
  numeral: '3a4b54', // numeral gigante de la portada: un tono sobre la tinta, sin transparencia
  ladrillo: 'b3372f', // --destructive del sitio: solo para el "qué NO"
  ladrilloSuave: 'f7e9e6',
  sageSuave: 'e9eee5',
  azulSuave: 'e8edf1',
}
const FACE = { regular: 'Poppins', negrita: 'Poppins', serif: 'Lora', serifCursiva: 'Lora' }
const CONTENIDO_BOTTOM = 6.9
const SOMBRA = { type: 'outer', color: '000000', opacity: 0.16, blur: 6, offset: 2, angle: 90 }

// ---------------------------------------------------------------------------
// Primitivas
// ---------------------------------------------------------------------------
function Deck({ curso, etiqueta, total, advertencias = [] }) {
  const pres = new pptxgen()
  B.setup(pres)
  pres.title = `${curso} — ${etiqueta}`
  pres.author = 'Elias Pacione — Psicología con sentido'
  pres.company = 'Elias Pacione'
  return { pres, curso, etiqueta, total, n: 0, advertencias, minPt: {}, tipos: {} }
}

function nueva(d, { fondo = C.crema, chrome = true, notas = '' } = {}) {
  const slide = d.pres.addSlide()
  d.n += 1
  slide.background = { color: fondo }
  if (chrome) {
    B.chrome(slide, { curso: d.curso, leccion: d.etiqueta })
    slide.addText(`${d.n} / ${d.total}`, { x: PAGE_W - 1.55, y: PAGE_H - 0.28, w: 1.0, h: 0.22, align: 'right', fontFace: 'Poppins', fontSize: 9, color: C.mutedFg, margin: 0 })
  }
  if (notas) slide.addNotes(notas)
  return slide
}

// Tamaño de letra más chico usado en cada diapositiva (para el reporte de legibilidad).
function reg(d, pt) {
  d.minPt[d.n] = Math.min(d.minPt[d.n] ?? 99, pt)
}

function aviso(d, donde, texto, fit) {
  d.advertencias.push(`[${d.etiqueta} · diapo ${d.n}] ${donde}: "${String(texto).slice(0, 60)}…" no entra (${fit.lineas.length} líneas a ${fit.pt}pt, alto ${fit.alto.toFixed(2)}in)`)
}

// Texto simple ajustado a su caja.
function t(d, slide, texto, o) {
  const { x, y, w, h, tipo = 'regular', max = 18, min = 11, color = C.tinta, align = 'left', valign = 'top', mult = 0.9, donde = 'texto' } = o
  const fit = M.ajustar(texto, { tipo, w, h, max, min, mult })
  if (!fit.ok) aviso(d, donde, texto, fit)
  reg(d, fit.pt)
  slide.addText(texto, {
    x, y, w, h, fontFace: FACE[tipo], bold: tipo === 'negrita', italic: tipo === 'serifCursiva',
    fontSize: fit.pt, color, align, valign, margin: 0, lineSpacingMultiple: mult, fit: 'none',
  })
  return fit
}

// Mide un bloque "lead en negrita + descripción" y devuelve el mayor tamaño que entra en h.
// La descripción va un 8 % más chica que el lead.
function fitTr(lead, desc, { w, h, max = 17, min = 12, mult = 0.9 }) {
  for (let pt = max; pt >= min - 1e-9; pt -= 0.5) {
    const l1 = M.lineas(lead, 'negrita', pt, w * M.SEGURIDAD).length
    const l2 = desc ? M.lineas(desc, 'regular', pt * 0.92, w * M.SEGURIDAD).length : 0
    const alto = M.alto(l1, 'negrita', pt, mult) + M.alto(l2, 'regular', pt * 0.92, mult)
    const palabras = Math.max(M.palabraMasAncha(lead, 'negrita', pt), desc ? M.palabraMasAncha(desc, 'regular', pt * 0.92) : 0)
    if (alto <= h && palabras <= w * M.SEGURIDAD) return { pt, alto, ok: true }
  }
  const l1 = M.lineas(lead, 'negrita', min, w * M.SEGURIDAD).length
  const l2 = desc ? M.lineas(desc, 'regular', min * 0.92, w * M.SEGURIDAD).length : 0
  return { pt: min, alto: M.alto(l1, 'negrita', min, mult) + M.alto(l2, 'regular', min * 0.92, mult), ok: false }
}

// Alto en pulgadas de un bloque "lead + descripción" a un tamaño fijo.
function altoTr(lead, desc, w, pt, mult = 0.9) {
  const l1 = M.lineas(lead, 'negrita', pt, w * M.SEGURIDAD).length
  const l2 = desc ? M.lineas(desc, 'regular', pt * 0.92, w * M.SEGURIDAD).length : 0
  return M.alto(l1, 'negrita', pt, mult) + M.alto(l2, 'regular', pt * 0.92, mult)
}

// Un solo cuerpo de letra para todos los textos "hermanos" de una diapositiva (el menor de los que
// entran): con tamaños distintos por tarjeta se ve desprolijo.
function ptComun(textos, { tipo = 'regular', w, h, max, min, mult = 0.9 }) {
  return Math.min(...textos.map((tx) => M.ajustar(tx, { tipo, w, h, max, min, mult }).pt))
}
function ptComunTr(pares, { w, h, max, min, mult = 0.9 }) {
  return Math.min(...pares.map(([l, dd]) => fitTr(l, dd, { w, h, max, min, mult }).pt))
}

// "Lead en negrita + descripción": el patrón de casi todas las tarjetas.
function tr(d, slide, lead, desc, o) {
  const { x, y, w, h, max = 17, min = 12, color = C.tinta, colorDesc = C.mutedFg, mult = 0.9, centrar = false, donde = 'tarjeta' } = o
  const fit = fitTr(lead, desc, { w, h, max, min, mult })
  if (!fit.ok) aviso(d, donde, desc ? `${lead} ${desc}` : lead, { pt: min, lineas: [lead], alto: fit.alto })
  reg(d, desc ? fit.pt * 0.92 : fit.pt)
  const runs = [{ text: lead, options: { bold: true, color, fontSize: fit.pt, fontFace: 'Poppins', breakLine: Boolean(desc) } }]
  if (desc) runs.push({ text: desc, options: { color: colorDesc, fontSize: +(fit.pt * 0.92).toFixed(1), fontFace: 'Poppins' } })
  slide.addText(runs, { x, y, w, h, valign: centrar ? 'middle' : 'top', margin: 0, lineSpacingMultiple: mult, fit: 'none' })
  return fit.pt
}

function tarjeta(slide, x, y, w, h, { fill = C.blanco, borde = null, sombra = true, radio = 0.1 } = {}) {
  slide.addShape('roundRect', {
    x, y, w, h, rectRadius: radio, fill: { color: fill },
    line: borde ? { color: borde, width: 0.75 } : { type: 'none' }, ...(sombra ? { shadow: SOMBRA } : {}),
  })
}

function insignia(slide, x, y, texto, { size = 0.42, fill = C.marca, color = C.blanco, fontSize = 14 } = {}) {
  slide.addShape('ellipse', { x, y, w: size, h: size, fill: { color: fill }, line: { type: 'none' } })
  slide.addText(String(texto), { x, y: y - 0.01, w: size, h: size, align: 'center', valign: 'middle', fontFace: 'Poppins', bold: true, fontSize, color, margin: 0 })
}

function linea(slide, x1, y1, x2, y2, { color = C.hondo, ancho = 1.5, flecha = false, dash } = {}) {
  const x = Math.min(x1, x2), y = Math.min(y1, y2)
  const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1)
  slide.addShape('line', {
    x, y, w, h, flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width: ancho, ...(flecha ? { endArrowType: 'triangle' } : {}), ...(dash ? { dashType: dash } : {}) },
  })
}

// Título de contenido: kicker en versalitas + frase-título (hasta 2 líneas). Devuelve el y
// donde puede empezar el contenido.
function titulo(d, slide, kicker, texto, { color = C.tinta, kickerColor = C.marca } = {}) {
  if (kicker) {
    slide.addText(kicker.toUpperCase(), { x: MARGIN, y: 0.84, w: CONTENT_W, h: 0.26, fontFace: 'Poppins', bold: true, fontSize: 11, color: kickerColor, charSpacing: 2, margin: 0 })
  }
  const fit = M.ajustar(texto, { tipo: 'negrita', w: CONTENT_W, h: 1.08, max: 29, min: 21, mult: 0.9 })
  if (!fit.ok) aviso(d, 'título', texto, fit)
  slide.addText(texto, { x: MARGIN, y: 1.1, w: CONTENT_W, h: 1.08, fontFace: 'Poppins', bold: true, fontSize: fit.pt, color, margin: 0, valign: 'top', lineSpacingMultiple: 0.9, fit: 'none' })
  return fit.lineas.length > 1 ? 2.3 : 1.95
}

// ---------------------------------------------------------------------------
// Portada de módulo
// ---------------------------------------------------------------------------
function portada(d, s) {
  const slide = nueva(d, { fondo: C.tinta, chrome: false, notas: s.notas })
  slide.addImage({ path: require('path').join(require('path').dirname(require.resolve('../../curso-pastoral/brand')), 'mark-crema.png'), x: 0.7, y: 0.62, w: 0.6, h: 0.6 })
  slide.addText('ELIAS PACIONE', { x: 1.45, y: 0.64, w: 5, h: 0.3, fontFace: 'Poppins', fontSize: 14, bold: true, color: C.blanco, margin: 0 })
  slide.addText('Psicología con sentido', { x: 1.45, y: 0.94, w: 5, h: 0.26, fontFace: 'Poppins', fontSize: 10, color: C.grisCalido, margin: 0 })
  if (s.numero !== undefined) {
    slide.addText(String(s.numero), { x: 8.2, y: 0.4, w: 4.6, h: 6.4, align: 'right', valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: 250, color: C.numeral, margin: 0 })
  }
  slide.addText(s.kicker.toUpperCase(), { x: 0.9, y: 2.35, w: 8, h: 0.34, fontFace: 'Poppins', bold: true, fontSize: 13, color: C.grisCalido, charSpacing: 3, margin: 0 })
  const f = t(d, slide, s.titulo, { x: 0.9, y: 2.8, w: 8.4, h: 2.0, tipo: 'negrita', max: 44, min: 28, color: C.blanco, mult: 0.92, donde: 'portada' })
  const yBajada = 2.8 + Math.min(2.0, f.alto) + 0.25
  t(d, slide, s.bajada, { x: 0.9, y: yBajada, w: 8.2, h: 1.4, tipo: 'serifCursiva', max: 19, min: 14, color: C.grisCalido, mult: 1, donde: 'bajada' })
  // chips
  let cx = 0.9
  for (const chip of s.chips ?? []) {
    const w = M.ancho(chip, 'regular', 12) + 0.5
    slide.addShape('roundRect', { x: cx, y: 6.3, w, h: 0.4, rectRadius: 0.2, fill: { color: C.tintaSuave }, line: { color: C.hondo, width: 0.75 } })
    slide.addText(chip, { x: cx, y: 6.3, w, h: 0.4, align: 'center', valign: 'middle', fontFace: 'Poppins', fontSize: 12, color: C.grisCalido, margin: 0 })
    cx += w + 0.18
  }
  slide.addShape('line', { x: 0.9, y: 5.95, w: 1.1, h: 0, line: { color: C.marca, width: 3 } })
}

// ---------------------------------------------------------------------------
// Objetivos (2×2, o 2 columnas si son más)
// ---------------------------------------------------------------------------
function objetivos(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker ?? 'Qué vamos a lograr', s.titulo ?? 'Objetivos del módulo')
  const n = s.items.length
  const filas = Math.ceil(n / 2)
  const gap = 0.22
  const w = (CONTENT_W - gap) / 2
  const h = (CONTENIDO_BOTTOM - top - gap * (filas - 1)) / filas
  const pt = ptComun(s.items, { w: w - 1.2, h: h - 0.28, max: filas > 2 ? 17 : 22, min: 12 })
  s.items.forEach((texto, i) => {
    const x = MARGIN + (i % 2) * (w + gap)
    const y = top + Math.floor(i / 2) * (h + gap)
    tarjeta(slide, x, y, w, h)
    insignia(slide, x + 0.28, y + h / 2 - 0.23, i + 1, { size: 0.46, fontSize: 15 })
    t(d, slide, texto, { x: x + 0.95, y: y + 0.14, w: w - 1.2, h: h - 0.28, max: pt, min: pt, valign: 'middle', donde: 'objetivo' })
  })
}

// ---------------------------------------------------------------------------
// Agenda del encuentro: barra proporcional de minutos + lista
// ---------------------------------------------------------------------------
function agenda(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker ?? 'Estructura del encuentro', s.titulo ?? `${s.total} minutos en ${s.bloques.length} bloques`)
  const tonos = [C.tinta, C.marca, C.hondo, C.sage, C.tintaSuave, C.grisCalido, C.marca]
  const oscuros = new Set([C.tinta, C.marca, C.hondo, C.tintaSuave])
  const barraY = top + 0.05
  const barraH = 0.62
  let x = MARGIN
  s.bloques.forEach((b, i) => {
    const w = (b.min / s.total) * CONTENT_W
    slide.addShape('rect', { x, y: barraY, w: w - 0.03, h: barraH, fill: { color: tonos[i % tonos.length] }, line: { type: 'none' } })
    slide.addText(`${b.min}′`, { x, y: barraY, w: w - 0.03, h: barraH, align: 'center', valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: b.min >= 15 ? 15 : 11, color: oscuros.has(tonos[i % tonos.length]) ? C.blanco : C.tinta, margin: 0 })
    x += w
  })
  const listaTop = barraY + barraH + 0.3
  const n = s.bloques.length
  const rowH = Math.min(0.6, (CONTENIDO_BOTTOM - listaTop) / n)
  const ptBloque = ptComun(s.bloques.map((b) => b.t), { w: CONTENT_W - 1.55, h: rowH - 0.04, max: 17, min: 12 })
  s.bloques.forEach((b, i) => {
    const y = listaTop + i * rowH
    slide.addShape('ellipse', { x: MARGIN, y: y + rowH / 2 - 0.09, w: 0.18, h: 0.18, fill: { color: tonos[i % tonos.length] }, line: { type: 'none' } })
    slide.addText(`${b.min} min`, { x: MARGIN + 0.35, y, w: 1.1, h: rowH, valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: 14, color: C.marca, margin: 0 })
    t(d, slide, b.t, { x: MARGIN + 1.55, y: y + 0.02, w: CONTENT_W - 1.55, h: rowH - 0.04, max: ptBloque, min: ptBloque, valign: 'middle', donde: 'bloque' })
  })
}

// ---------------------------------------------------------------------------
// Tarjetas (2 a 4 columnas, o grilla 2×2)
// ---------------------------------------------------------------------------
function tarjetas(d, s) {
  const slide = nueva(d, { notas: s.notas })
  let top = titulo(d, slide, s.kicker, s.titulo)
  if (s.lead) {
    const f = t(d, slide, s.lead, { x: MARGIN, y: top - 0.1, w: CONTENT_W, h: 0.8, tipo: 'serifCursiva', max: 19, min: 13, color: C.mutedFg, mult: 1, donde: 'lead' })
    top += Math.min(0.85, f.alto + 0.15)
  }
  const n = s.tarjetas.length
  const cols = s.cols ?? (n === 4 && s.grilla ? 2 : n)
  const filas = Math.ceil(n / cols)
  const gap = 0.26
  const w = (CONTENT_W - gap * (cols - 1)) / cols
  const dispH = (CONTENIDO_BOTTOM - top - gap * (filas - 1)) / filas
  const interior = w - 0.55
  const hayLetra = s.tarjetas.some((c) => c.letra)
  const kickerH = (c) => (c.kicker ? 0.3 : 0) + (hayLetra ? 0.62 : 0)
  // un solo tamaño para todas las tarjetas (el menor de los que entran), así la fila se ve pareja
  const maxPt = s.max ?? 22
  let pt = maxPt
  for (const c of s.tarjetas) {
    const r = fitTr(c.titulo, c.texto, { w: interior, h: dispH - 0.55 - kickerH(c), max: maxPt, min: 12 })
    pt = Math.min(pt, r.pt)
  }
  const necesario = Math.max(...s.tarjetas.map((c) => fitTr(c.titulo, c.texto, { w: interior, h: dispH, max: pt, min: pt }).alto + kickerH(c)))
  const h = Math.min(dispH, Math.max(2.3, necesario + 0.62))
  const yBase = top + (dispH - h) / 2
  s.tarjetas.forEach((c, i) => {
    const x = MARGIN + (i % cols) * (w + gap)
    const y = yBase + Math.floor(i / cols) * (dispH + gap)
    const oscura = Boolean(c.oscura)
    tarjeta(slide, x, y, w, h, { fill: oscura ? C.tinta : C.blanco })
    if (!hayLetra) slide.addShape('rect', { x: x + 0.01, y: y + 0.28, w: 0.07, h: 0.5, fill: { color: oscura ? C.sage : C.marca }, line: { type: 'none' } })
    let cy = y + 0.26
    if (c.letra) {
      insignia(slide, x + 0.3, cy, c.letra, { size: 0.5, fill: oscura ? C.sage : C.marca, color: oscura ? C.tinta : C.blanco, fontSize: 18 })
      cy += 0.62
    }
    if (c.kicker) {
      slide.addText(c.kicker.toUpperCase(), { x: x + 0.3, y: cy, w: w - 0.55, h: 0.24, fontFace: 'Poppins', bold: true, fontSize: 9.5, color: oscura ? C.grisCalido : C.marca, charSpacing: 1, margin: 0 })
      cy += 0.3
    }
    tr(d, slide, c.titulo, c.texto, { x: x + 0.3, y: cy, w: interior, h: y + h - cy - 0.22, max: pt, min: pt, color: oscura ? C.blanco : C.tinta, colorDesc: oscura ? C.grisCalido : C.mutedFg, donde: 'tarjeta' })
  })
}

// ---------------------------------------------------------------------------
// Lista de enunciados (lead + descripción), con viñeta de acento
// ---------------------------------------------------------------------------
function lista(d, s) {
  const slide = nueva(d, { notas: s.notas })
  let top = titulo(d, slide, s.kicker, s.titulo)
  if (s.lead) {
    const f = t(d, slide, s.lead, { x: MARGIN, y: top - 0.1, w: CONTENT_W, h: 0.8, tipo: 'serifCursiva', max: 19, min: 13, color: C.mutedFg, mult: 1, donde: 'lead' })
    top += Math.min(0.85, f.alto + 0.15)
  }
  const n = s.items.length
  const gap = 0.14
  const w = CONTENT_W - 0.65
  const disp = CONTENIDO_BOTTOM - top
  const PAD = s.enLinea ? 0.3 : 0.34
  // enLinea: "lead — descripción" como un solo párrafo (listas de enunciados cortos)
  const unir = (it) => (it.d ? `${it.t} — ${it.d}` : it.t)
  const altoItem = (it, p) => (s.enLinea
    ? M.alto(M.lineas(unir(it), 'negrita', p, w * M.SEGURIDAD).length, 'negrita', p, 0.9)
    : altoTr(it.t, it.d, w, p))
  // el mayor cuerpo de letra con el que TODAS las filas entran, cada una con la altura que necesita
  let pt = 12
  for (let p = s.max ?? 22; p >= 12 - 1e-9; p -= 0.5) {
    const total = s.items.reduce((acc, it) => acc + altoItem(it, p) + PAD, 0) + gap * (n - 1)
    const palabras = Math.max(...s.items.map((it) => Math.max(M.palabraMasAncha(it.t, 'negrita', p), it.d ? M.palabraMasAncha(it.d, 'regular', p * 0.92) : 0)))
    if (total <= disp && palabras <= w * M.SEGURIDAD) { pt = p; break }
  }
  const necesarios = s.items.map((it) => altoItem(it, pt) + PAD)
  const sobra = Math.max(0, (disp - necesarios.reduce((a, b) => a + b, 0) - gap * (n - 1)) / n)
  const alturas = necesarios.map((h) => Math.min(h + sobra, 1.45))
  const bloque = alturas.reduce((a, b) => a + b, 0) + gap * (n - 1)
  let y = top + Math.max(0, (disp - bloque) / 2)
  s.items.forEach((it, i) => {
    const h = alturas[i]
    tarjeta(slide, MARGIN, y, CONTENT_W, h, { sombra: false, borde: C.grisCalido })
    slide.addShape('rect', { x: MARGIN, y: y + 0.1, w: 0.08, h: h - 0.2, fill: { color: it.acento ?? C.marca }, line: { type: 'none' } })
    reg(d, pt)
    if (s.enLinea) {
      const runs = [{ text: it.t, options: { bold: true, color: C.tinta, fontSize: pt, fontFace: 'Poppins' } }]
      if (it.d) runs.push({ text: ` — ${it.d}`, options: { color: C.mutedFg, fontSize: pt, fontFace: 'Poppins' } })
      slide.addText(runs, { x: MARGIN + 0.35, y: y + 0.08, w, h: h - 0.16, valign: 'middle', margin: 0, lineSpacingMultiple: 0.9, fit: 'none' })
    } else {
      tr(d, slide, it.t, it.d, { x: MARGIN + 0.35, y: y + 0.08, w, h: h - 0.16, max: pt, min: pt, centrar: true, donde: 'ítem' })
    }
    y += h + gap
  })
}

// ---------------------------------------------------------------------------
// Comparación en dos columnas (SÍ/NO, antes/después, dos conceptos)
// ---------------------------------------------------------------------------
function comparacion(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const gap = 0.3
  const w = (CONTENT_W - gap) / 2
  const h = CONTENIDO_BOTTOM - top
  const tonos = {
    sage: { banda: C.sage, texto: C.tinta, fondo: C.sageSuave },
    ladrillo: { banda: C.ladrillo, texto: C.blanco, fondo: C.ladrilloSuave },
    marca: { banda: C.marca, texto: C.blanco, fondo: C.azulSuave },
    tinta: { banda: C.tinta, texto: C.blanco, fondo: C.blanco },
    hondo: { banda: C.hondo, texto: C.blanco, fondo: C.azulSuave },
  }
  const ptCol = Math.min(...[s.izq, s.der].map((col) => bulletsPt(col.items, { w: w - 0.64, h: h - 1.25, max: s.max ?? 21, min: 12, espacio: 0.2 })))
  ;[s.izq, s.der].forEach((col, i) => {
    const x = MARGIN + i * (w + gap)
    const tono = tonos[col.tono ?? (i === 0 ? 'marca' : 'tinta')]
    tarjeta(slide, x, top, w, h, { fill: tono.fondo })
    slide.addShape('roundRect', { x, y: top, w, h: 0.78, rectRadius: 0.1, fill: { color: tono.banda }, line: { type: 'none' } })
    slide.addShape('rect', { x, y: top + 0.4, w, h: 0.38, fill: { color: tono.banda }, line: { type: 'none' } })
    t(d, slide, col.titulo, { x: x + 0.3, y: top + 0.04, w: w - 0.6, h: 0.7, tipo: 'negrita', max: 20, min: 14, color: tono.texto, valign: 'middle', donde: 'cabecera' })
    bullets(d, slide, col.items, { x: x + 0.32, y: top + 1.05, w: w - 0.64, h: h - 1.25, max: ptCol, min: ptCol, espacio: 0.2 })
  })
}

// Mayor tamaño con el que una lista de viñetas entra en w × h (todas al mismo tamaño).
function bulletsPt(items, { w, h, max = 17, min = 12, mult = 0.92, espacio = 0.14 }) {
  const sangria = 0.28
  for (let p = max; p >= min - 1e-9; p -= 0.5) {
    const alto = items.reduce((s, it) => s + M.alto(M.lineas(it, 'regular', p, (w - sangria) * M.SEGURIDAD).length, 'regular', p, mult) + espacio, 0) - espacio
    const palabras = Math.max(...items.map((it) => M.palabraMasAncha(it, 'regular', p)))
    if (alto <= h && palabras <= (w - sangria) * M.SEGURIDAD) return p
  }
  return min
}

// Viñetas medidas: todas al mismo tamaño, el mayor que entra.
function bullets(d, slide, items, { x, y, w, h, max = 17, min = 12, color = C.tinta, mult = 0.92, espacio = 0.14 }) {
  const sangria = 0.28
  const pt = bulletsPt(items, { w, h, max, min, mult, espacio })
  const alto = items.reduce((s, it) => s + M.alto(M.lineas(it, 'regular', pt, (w - sangria) * M.SEGURIDAD).length, 'regular', pt, mult) + espacio, 0) - espacio
  if (alto > h) aviso(d, 'viñetas', items[0], { pt, lineas: items, alto })
  reg(d, pt)
  const runs = items.map((it, i) => ({ text: it, options: { bullet: { code: '25AA', indent: 16 }, breakLine: i < items.length - 1, color, fontSize: pt, fontFace: 'Poppins', paraSpaceAfter: Math.round(espacio * 72) } }))
  slide.addText(runs, { x, y, w, h, valign: 'top', margin: 0, lineSpacingMultiple: mult, fit: 'none' })
  return pt
}

// ---------------------------------------------------------------------------
// Puntos: una tarjeta con viñetas (listados largos, bibliografía)
// ---------------------------------------------------------------------------
function puntos(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const h = CONTENIDO_BOTTOM - top
  tarjeta(slide, MARGIN, top, CONTENT_W, h)
  bullets(d, slide, s.items, { x: MARGIN + 0.45, y: top + 0.38, w: CONTENT_W - 0.9, h: h - 0.76, max: s.max ?? 20, min: 11, espacio: s.espacio ?? 0.16 })
}

// ---------------------------------------------------------------------------
// Datos: números grandes
// ---------------------------------------------------------------------------
function datos(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const n = s.datos.length
  const gap = 0.28
  const w = (CONTENT_W - gap * (n - 1)) / n
  const dispH = CONTENIDO_BOTTOM - top - (s.nota ? 0.85 : 0)
  const h = Math.min(dispH, 4.4)
  const yD = top + (dispH - h) / 2
  s.datos.forEach((dato, i) => {
    const x = MARGIN + i * (w + gap)
    tarjeta(slide, x, yD, w, h)
    const f = M.ajustar(dato.valor, { tipo: 'negrita', w: w - 0.5, h: 1.2, max: 56, min: 30, mult: 0.9 })
    slide.addText(dato.valor, { x: x + 0.25, y: yD + 0.3, w: w - 0.5, h: 1.25, fontFace: 'Poppins', bold: true, fontSize: f.pt, color: C.marca, valign: 'middle', margin: 0, fit: 'none' })
    slide.addShape('line', { x: x + 0.25, y: yD + 1.7, w: 0.8, h: 0, line: { color: C.sage, width: 3 } })
    tr(d, slide, dato.etiqueta, dato.nota, { x: x + 0.25, y: yD + 1.9, w: w - 0.5, h: h - 2.1, max: 20, min: 12, donde: 'dato' })
  })
  if (s.nota) t(d, slide, s.nota, { x: MARGIN, y: CONTENIDO_BOTTOM - 0.7, w: CONTENT_W, h: 0.7, tipo: 'serifCursiva', max: 15, min: 12, color: C.mutedFg, mult: 1, valign: 'bottom', donde: 'nota' })
}

// ---------------------------------------------------------------------------
// Pasos / secuencia (flechas entre tarjetas; `cols` para pasar a dos filas)
// ---------------------------------------------------------------------------
function pasos(d, s) {
  const slide = nueva(d, { notas: s.notas })
  let top = titulo(d, slide, s.kicker, s.titulo)
  const n = s.pasos.length
  const cols = s.cols ?? n
  const filas = Math.ceil(n / cols)
  const flecha = 0.34
  const gapY = 0.28
  const w = (CONTENT_W - flecha * (cols - 1)) / cols
  const areaH = CONTENIDO_BOTTOM - top - (s.nota ? 0.62 : 0)
  const h = (areaH - gapY * (filas - 1)) / filas
  const ptPaso = ptComunTr(s.pasos.map((p) => [p.t, p.d]), { w: w - 0.44, h: h - 0.86, max: s.max ?? 20, min: 11.5 })
  s.pasos.forEach((p, i) => {
    const col = i % cols, fila = Math.floor(i / cols)
    const x = MARGIN + col * (w + flecha)
    const y = top + fila * (h + gapY)
    const destacado = s.destacar === i
    tarjeta(slide, x, y, w, h, { fill: destacado ? C.tinta : C.blanco })
    insignia(slide, x + 0.22, y + 0.2, p.n ?? i + 1, { fill: destacado ? C.blanco : C.marca, color: destacado ? C.tinta : C.blanco })
    if (p.kicker) slide.addText(p.kicker.toUpperCase(), { x: x + 0.78, y: y + 0.22, w: w - 0.95, h: 0.38, valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: 9, color: destacado ? C.grisCalido : C.marca, charSpacing: 1, margin: 0 })
    tr(d, slide, p.t, p.d, { x: x + 0.22, y: y + 0.74, w: w - 0.44, h: h - 0.86, max: ptPaso, min: ptPaso, color: destacado ? C.blanco : C.tinta, colorDesc: destacado ? C.grisCalido : C.mutedFg, donde: 'paso' })
    if (col < cols - 1 && i < n - 1) {
      slide.addShape('rightArrow', { x: x + w + 0.04, y: y + h / 2 - 0.13, w: flecha - 0.08, h: 0.26, fill: { color: C.hondo }, line: { type: 'none' } })
    }
  })
  if (s.nota) t(d, slide, s.nota, { x: MARGIN, y: CONTENIDO_BOTTOM - 0.5, w: CONTENT_W, h: 0.5, tipo: 'serifCursiva', max: 15, min: 12, color: C.mutedFg, mult: 1, align: 'center', valign: 'bottom', donde: 'nota' })
}

// ---------------------------------------------------------------------------
// Ciclo (6 nodos sobre una elipse). `resaltar` = índice del nodo que se destaca.
// ---------------------------------------------------------------------------
function ciclo(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const n = s.etapas.length
  const cx = PAGE_W / 2
  const cy = top + (CONTENIDO_BOTTOM - top) / 2 + 0.02
  const rx = 4.0
  const ry = (CONTENIDO_BOTTOM - top) / 2 - 0.62
  slide.addShape('ellipse', { x: cx - rx, y: cy - ry, w: rx * 2, h: ry * 2, fill: { type: 'none' }, line: { color: C.grisCalido, width: 4, dashType: 'dash' } })
  const rad = (g) => (g * Math.PI) / 180
  // flechitas de sentido horario entre nodos
  for (let k = 0; k < n; k++) {
    const g = -90 + (360 / n) * k + 360 / n / 2
    const px = cx + rx * Math.cos(rad(g)), py = cy + ry * Math.sin(rad(g))
    const tx = -rx * Math.sin(rad(g)), ty = ry * Math.cos(rad(g))
    const ang = (Math.atan2(ty, tx) * 180) / Math.PI
    slide.addShape('triangle', { x: px - 0.13, y: py - 0.13, w: 0.26, h: 0.26, rotate: ang + 90, fill: { color: C.hondo }, line: { type: 'none' } })
  }
  const nw = 3.25, nh = 1.16
  const ptEtapa = ptComunTr(s.etapas.map((e) => [e.t, e.d]), { w: nw - 0.78, h: nh - 0.16, max: 16.5, min: 11, mult: 0.88 })
  s.etapas.forEach((e, i) => {
    const g = -90 + (360 / n) * i
    const px = cx + rx * Math.cos(rad(g)), py = cy + ry * Math.sin(rad(g))
    const x = px - nw / 2, y = py - nh / 2
    const res = s.resaltar === i
    tarjeta(slide, x, y, nw, nh, { fill: res ? C.tinta : C.blanco })
    insignia(slide, x + 0.14, y + nh / 2 - 0.2, i + 1, { size: 0.4, fill: res ? C.blanco : C.marca, color: res ? C.tinta : C.blanco, fontSize: 13 })
    tr(d, slide, e.t, e.d, { x: x + 0.66, y: y + 0.09, w: nw - 0.78, h: nh - 0.16, max: ptEtapa, min: ptEtapa, color: res ? C.blanco : C.tinta, colorDesc: res ? C.grisCalido : C.mutedFg, mult: 0.88, centrar: true, donde: 'etapa' })
  })
  if (s.centro) {
    t(d, slide, s.centro, { x: cx - 1.75, y: cy - 0.62, w: 3.5, h: 0.78, tipo: 'negrita', max: 20, min: 14, color: C.marca, align: 'center', valign: 'middle', donde: 'centro' })
    if (s.centroNota) t(d, slide, s.centroNota, { x: cx - 1.75, y: cy + 0.2, w: 3.5, h: 0.7, tipo: 'serifCursiva', max: 14, min: 11, color: C.mutedFg, align: 'center', mult: 1, donde: 'centroNota' })
  }
}

// ---------------------------------------------------------------------------
// Curva: una campana con rótulos (el craving sube, llega a un pico y desciende)
//   s = { ejeX, ejeY, puntos: [{ t: 0..1, rotulo }], pico: 0..1 }
// ---------------------------------------------------------------------------
function curva(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const gx = MARGIN + 0.9, gy = top + 0.1
  const gw = CONTENT_W - 1.2, gh = CONTENIDO_BOTTOM - top - 0.9
  tarjeta(slide, MARGIN, top - 0.05, CONTENT_W, CONTENIDO_BOTTOM - top + 0.05)
  // ejes
  linea(slide, gx, gy + 0.1, gx, gy + gh, { color: C.hondo, ancho: 2, flecha: true })
  linea(slide, gx, gy + gh, gx + gw, gy + gh, { color: C.hondo, ancho: 2, flecha: true })
  slide.addText(s.ejeX ?? 'tiempo', { x: gx + gw - 3.4, y: gy + gh + 0.1, w: 3.4, h: 0.3, align: 'right', fontFace: 'Lora', italic: true, fontSize: 13, color: C.mutedFg, margin: 0 })
  slide.addText(s.ejeY ?? 'intensidad', { x: gx + 0.18, y: gy - 0.08, w: 3.4, h: 0.3, fontFace: 'Lora', italic: true, fontSize: 13, color: C.mutedFg, margin: 0 })
  // la campana: un seno elevado, dibujado con segmentos cortos y puntas redondeadas
  const f = (u) => Math.pow(Math.sin(Math.PI * Math.pow(u, 0.82)), 1.35)
  const N = 90
  const pt = (u) => [gx + 0.25 + u * (gw - 0.5), gy + gh - 0.02 - f(u) * (gh - 0.55)]
  for (let i = 0; i < N; i++) {
    const [x1, y1] = pt(i / N)
    const [x2, y2] = pt((i + 1) / N)
    linea(slide, x1, y1, x2, y2, { color: C.marca, ancho: 5 })
  }
  // área bajo el pico (pico = 0.5 aprox. con el exponente elegido)
  const picoU = s.pico ?? 0.55
  const [px, py] = pt(picoU)
  slide.addShape('ellipse', { x: px - 0.13, y: py - 0.13, w: 0.26, h: 0.26, fill: { color: C.tinta }, line: { color: C.blanco, width: 2 } })
  for (const r of s.rotulos) {
    const [rx, ry] = pt(r.u)
    slide.addShape('ellipse', { x: rx - 0.08, y: ry - 0.08, w: 0.16, h: 0.16, fill: { color: C.sage }, line: { color: C.tinta, width: 1.5 } })
    const w = 3.3
    // los rótulos van DENTRO de la campana, debajo de la línea (ahí hay lugar de sobra y nunca
    // se pisan con la curva): el de la subida hacia la derecha, el de la bajada hacia la izquierda;
    // el del pico, arriba y centrado
    const lado = r.lado ?? (Math.abs(r.u - picoU) < 0.06 ? 'arriba' : r.u < picoU ? 'izq' : 'der')
    if (lado === 'arriba') {
      t(d, slide, r.t, { x: rx - w / 2, y: ry - 0.75, w, h: 0.5, tipo: 'negrita', max: 15, min: 11, align: 'center', valign: 'bottom', color: C.tinta, donde: 'rótulo' })
    } else if (lado === 'izq') {
      t(d, slide, r.t, { x: rx + 0.28, y: ry + 0.14, w, h: 0.9, tipo: 'regular', max: 15.5, min: 11, align: 'left', valign: 'top', mult: 0.92, donde: 'rótulo' })
    } else {
      t(d, slide, r.t, { x: rx - w - 0.28, y: ry + 0.14, w, h: 0.9, tipo: 'regular', max: 15.5, min: 11, align: 'right', valign: 'top', mult: 0.92, donde: 'rótulo' })
    }
  }
}

// ---------------------------------------------------------------------------
// Escalera de niveles (de menor a mayor intensidad)
// ---------------------------------------------------------------------------
function escalera(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const n = s.niveles.length
  const gap = 0.1
  const w = (CONTENT_W - gap * (n - 1)) / n
  const base = CONTENIDO_BOTTOM - 0.42
  const hMin = 2.7, hMax = base - top
  const tonos = [C.azulSuave, C.grisCalido, C.sage, C.hondo, C.marca, C.tinta]
  const oscuros = new Set([C.hondo, C.marca, C.tinta])
  const ptNivel = ptComunTr(s.niveles.map((nv) => [nv.t, nv.d]), { w: w - 0.36, h: hMin - 0.86, max: 17, min: 11 })
  s.niveles.forEach((nv, i) => {
    const h = hMin + ((hMax - hMin) * i) / Math.max(1, n - 1)
    const x = MARGIN + i * (w + gap)
    const y = base - h
    const fill = tonos[Math.min(tonos.length - 1, Math.round((i * (tonos.length - 1)) / Math.max(1, n - 1)))]
    slide.addShape('rect', { x, y, w, h, fill: { color: fill }, line: { type: 'none' } })
    const col = oscuros.has(fill) ? C.blanco : C.tinta
    insignia(slide, x + 0.18, y + 0.18, i + 1, { size: 0.4, fill: oscuros.has(fill) ? C.blanco : C.marca, color: oscuros.has(fill) ? C.tinta : C.blanco, fontSize: 13 })
    tr(d, slide, nv.t, nv.d, { x: x + 0.18, y: y + 0.72, w: w - 0.36, h: h - 0.86, max: ptNivel, min: ptNivel, color: col, colorDesc: oscuros.has(fill) ? C.grisCalido : C.tintaSuave, donde: 'nivel' })
  })
  slide.addShape('line', { x: MARGIN, y: base + 0.22, w: CONTENT_W, h: 0, line: { color: C.hondo, width: 2, endArrowType: 'triangle' } })
  slide.addText(s.eje ?? 'de menor a mayor intensidad', { x: MARGIN, y: base + 0.27, w: CONTENT_W, h: 0.24, align: 'center', fontFace: 'Lora', italic: true, fontSize: 11.5, color: C.mutedFg, margin: 0 })
}

// ---------------------------------------------------------------------------
// MAPA CONCEPTUAL (árbol de izquierda a derecha)
//   centro → ramas (concepto) → hojas (concepto), con una FRASE DE ENLACE sobre cada
//   conexión centro→rama (lo que distingue un mapa conceptual de una lista con flechas).
//   s = { centro, ramas: [{ rel, t, hijos: [..] }] }
// ---------------------------------------------------------------------------
function mapa(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker ?? 'Mapa conceptual', s.titulo)
  const area = CONTENIDO_BOTTOM - top
  const filasHojas = s.ramas.map((r) => Math.max(1, r.hijos?.length ?? 0))
  const totalFilas = filasHojas.reduce((a, b) => a + b, 0)
  const gapRama = 0.18
  const rowH = Math.min(1.15, (area - gapRama * (s.ramas.length - 1)) / totalFilas)
  const bloqueH = rowH * totalFilas + gapRama * (s.ramas.length - 1)
  const y0 = top + (area - bloqueH) / 2
  // columnas
  const rootX = MARGIN, rootW = 2.35
  const troncoX = rootX + rootW + 0.35
  const ramaX = troncoX + 1.5, ramaW = 3.1
  const hojaX = ramaX + ramaW + 0.5, hojaW = MARGIN + CONTENT_W - hojaX
  const hojaH = Math.min(rowH - 0.12, 0.95)
  const ptRama = ptComun(s.ramas.map((r) => r.t), { tipo: 'negrita', w: ramaW - 0.3, h: Math.max(0.4, Math.min(...filasHojas.map((f) => Math.min(rowH * f - 0.06, 1.05))) - 0.1), max: 17.5, min: 11 })
  const ptHoja = ptComun(s.ramas.flatMap((r) => r.hijos ?? []), { w: hojaW - 0.28, h: hojaH - 0.06, max: 16, min: 10.5, mult: 0.88 })
  // raíz centrada
  const rootH = 1.5
  const rootCy = y0 + bloqueH / 2
  slide.addShape('roundRect', { x: rootX, y: rootCy - rootH / 2, w: rootW, h: rootH, rectRadius: 0.14, fill: { color: C.tinta }, line: { type: 'none' }, shadow: SOMBRA })
  t(d, slide, s.centro, { x: rootX + 0.15, y: rootCy - rootH / 2 + 0.1, w: rootW - 0.3, h: rootH - 0.2, tipo: 'negrita', max: 20, min: 13, color: C.blanco, align: 'center', valign: 'middle', donde: 'centro' })
  let y = y0
  s.ramas.forEach((r, i) => {
    const filas = filasHojas[i]
    const h = rowH * filas
    const cy = y + h / 2
    const alto = Math.min(h - 0.06, 1.05)
    // conexión raíz → rama (tres tramos) y frase de enlace
    linea(slide, rootX + rootW, rootCy, troncoX, rootCy, { color: C.hondo })
    linea(slide, troncoX, rootCy, troncoX, cy, { color: C.hondo })
    linea(slide, troncoX, cy, ramaX, cy, { color: C.hondo, flecha: true })
    if (r.rel) {
      slide.addText(r.rel, { x: troncoX + 0.04, y: cy - 0.36, w: ramaX - troncoX - 0.1, h: 0.32, align: 'center', valign: 'bottom', fontFace: 'Lora', italic: true, fontSize: 12.5, color: C.marca, margin: 0 })
    }
    // rama
    slide.addShape('roundRect', { x: ramaX, y: cy - alto / 2, w: ramaW, h: alto, rectRadius: 0.1, fill: { color: C.marca }, line: { type: 'none' }, shadow: SOMBRA })
    t(d, slide, r.t, { x: ramaX + 0.15, y: cy - alto / 2 + 0.05, w: ramaW - 0.3, h: alto - 0.1, tipo: 'negrita', max: ptRama, min: ptRama, color: C.blanco, align: 'center', valign: 'middle', donde: 'rama' })
    // hojas
    const hijos = r.hijos ?? []
    hijos.forEach((hj, k) => {
      const hy = y + k * rowH + rowH / 2
      const hh = hojaH
      linea(slide, ramaX + ramaW, cy, hojaX - 0.22, hy, { color: C.grisCalido, ancho: 1.25 })
      linea(slide, hojaX - 0.22, hy, hojaX, hy, { color: C.grisCalido, ancho: 1.25 })
      slide.addShape('roundRect', { x: hojaX, y: hy - hh / 2, w: hojaW, h: hh, rectRadius: 0.08, fill: { color: C.blanco }, line: { color: C.grisCalido, width: 0.75 } })
      t(d, slide, hj, { x: hojaX + 0.14, y: hy - hh / 2 + 0.03, w: hojaW - 0.28, h: hh - 0.06, max: ptHoja, min: ptHoja, valign: 'middle', mult: 0.88, donde: 'hoja' })
    })
    y += h + gapRama
  })
}

// ---------------------------------------------------------------------------
// HUB: un concepto central con seis (o cuatro) satélites, tres a cada lado.
//   s = { centro, centroNota?, satelites: [{ tag, t, d }] }
// ---------------------------------------------------------------------------
function hub(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker ?? 'Mapa conceptual', s.titulo)
  const n = s.satelites.length
  const porLado = Math.ceil(n / 2)
  const gap = 0.2
  const cardW = 4.15
  const h = (CONTENIDO_BOTTOM - top - gap * (porLado - 1)) / porLado
  const centroW = 2.9, centroH = 2.0
  const centroX = PAGE_W / 2 - centroW / 2
  const centroY = top + (CONTENIDO_BOTTOM - top) / 2 - centroH / 2
  const ptSat = ptComunTr(s.satelites.map((x) => [x.t, x.d]), { w: cardW - 0.4, h: h - 0.64, max: 16, min: 11 })
  s.satelites.forEach((sat, i) => {
    const lado = i < porLado ? 0 : 1
    const fila = lado === 0 ? i : i - porLado
    const x = lado === 0 ? MARGIN : MARGIN + CONTENT_W - cardW
    const y = top + fila * (h + gap)
    const ex = lado === 0 ? x + cardW : x
    const ey = y + h / 2
    const cxn = lado === 0 ? centroX : centroX + centroW
    linea(slide, cxn, centroY + centroH / 2, ex, ey, { color: C.hondo, ancho: 1.75 })
    tarjeta(slide, x, y, cardW, h)
    slide.addShape('roundRect', { x: x + 0.2, y: y + 0.16, w: 1.12, h: 0.3, rectRadius: 0.15, fill: { color: C.sageSuave }, line: { type: 'none' } })
    slide.addText(sat.tag, { x: x + 0.2, y: y + 0.16, w: 1.12, h: 0.3, align: 'center', valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: 9.5, color: C.tinta, margin: 0 })
    tr(d, slide, sat.t, sat.d, { x: x + 0.2, y: y + 0.54, w: cardW - 0.4, h: h - 0.64, max: ptSat, min: ptSat, donde: 'satélite' })
  })
  slide.addShape('roundRect', { x: centroX, y: centroY, w: centroW, h: centroH, rectRadius: 0.16, fill: { color: C.tinta }, line: { type: 'none' }, shadow: SOMBRA })
  t(d, slide, s.centro, { x: centroX + 0.18, y: centroY + 0.15, w: centroW - 0.36, h: centroH * 0.55, tipo: 'negrita', max: 20, min: 13, color: C.blanco, align: 'center', valign: 'middle', donde: 'centro' })
  if (s.centroNota) t(d, slide, s.centroNota, { x: centroX + 0.18, y: centroY + centroH * 0.62, w: centroW - 0.36, h: centroH * 0.3, tipo: 'serifCursiva', max: 12.5, min: 10, color: C.grisCalido, align: 'center', mult: 1, donde: 'centroNota' })
}

// ---------------------------------------------------------------------------
// Frase destacada
// ---------------------------------------------------------------------------
function frase(d, s) {
  const slide = nueva(d, { fondo: s.claro ? C.crema : C.tinta, chrome: Boolean(s.claro), notas: s.notas })
  const oscuro = !s.claro
  if (oscuro) {
    slide.addImage({ path: require('path').join(require('path').dirname(require.resolve('../../curso-pastoral/brand')), 'mark-crema.png'), x: PAGE_W - 1.5, y: 0.55, w: 0.6, h: 0.6 })
  }
  slide.addText('“', { x: 0.8, y: 1.0, w: 1.4, h: 1.6, fontFace: 'Lora', bold: true, fontSize: 120, color: oscuro ? C.marca : C.sage, margin: 0 })
  t(d, slide, s.texto, { x: 1.5, y: 2.2, w: PAGE_W - 3.0, h: 3.2, tipo: 'serifCursiva', max: 38, min: 22, color: oscuro ? C.blanco : C.tinta, mult: 1.05, valign: 'middle', donde: 'frase' })
  if (s.autor) t(d, slide, s.autor, { x: 1.5, y: 5.6, w: PAGE_W - 3.0, h: 1.0, tipo: 'regular', max: 16, min: 12, color: oscuro ? C.grisCalido : C.mutedFg, donde: 'autor' })
}

// ---------------------------------------------------------------------------
// Claves del módulo (fondo oscuro, 3 a 5 enunciados numerados) + llavecita dibujada
// ---------------------------------------------------------------------------
function llave(slide, x, y, color) {
  slide.addShape('ellipse', { x, y, w: 0.42, h: 0.42, fill: { type: 'none' }, line: { color, width: 3.5 } })
  slide.addShape('rect', { x: x + 0.38, y: y + 0.175, w: 0.62, h: 0.09, fill: { color }, line: { type: 'none' } })
  slide.addShape('rect', { x: x + 0.78, y: y + 0.24, w: 0.09, h: 0.17, fill: { color }, line: { type: 'none' } })
  slide.addShape('rect', { x: x + 0.93, y: y + 0.24, w: 0.09, h: 0.13, fill: { color }, line: { type: 'none' } })
}

function claves(d, s) {
  const slide = nueva(d, { fondo: C.tinta, chrome: false, notas: s.notas })
  llave(slide, MARGIN, 0.62, C.sage)
  slide.addText((s.kicker ?? 'Para llevarse').toUpperCase(), { x: MARGIN + 1.3, y: 0.62, w: 6, h: 0.24, fontFace: 'Poppins', bold: true, fontSize: 11, color: C.sage, charSpacing: 2, margin: 0 })
  slide.addText(s.titulo ?? 'Claves del módulo', { x: MARGIN + 1.3, y: 0.86, w: 9, h: 0.6, fontFace: 'Poppins', bold: true, fontSize: 30, color: C.blanco, margin: 0 })
  slide.addText(`${d.n} / ${d.total}`, { x: PAGE_W - 1.55, y: PAGE_H - 0.34, w: 1.0, h: 0.22, align: 'right', fontFace: 'Poppins', fontSize: 9, color: C.grisCalido, margin: 0 })
  const top = 1.85
  const n = s.items.length
  const gap = 0.12
  const h = (6.95 - top - gap * (n - 1)) / n
  const ptClave = ptComunTr(s.items.map((it) => (typeof it === 'string' ? [it, null] : [it.t, it.d])), { w: CONTENT_W - 1.6, h: h - 0.2, max: s.max ?? 24, min: 13 })
  s.items.forEach((it, i) => {
    const y = top + i * (h + gap)
    slide.addShape('roundRect', { x: MARGIN, y, w: CONTENT_W, h, rectRadius: 0.1, fill: { color: C.tintaSuave }, line: { type: 'none' } })
    slide.addText(String(i + 1), { x: MARGIN + 0.25, y, w: 0.8, h, align: 'center', valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: 34, color: C.sage, margin: 0 })
    const tipo = typeof it === 'string' ? it : it.t
    const det = typeof it === 'string' ? null : it.d
    tr(d, slide, tipo, det, { x: MARGIN + 1.3, y: y + 0.1, w: CONTENT_W - 1.6, h: h - 0.2, max: ptClave, min: ptClave, color: C.blanco, colorDesc: C.grisCalido, centrar: true, donde: 'clave' })
  })
}

// ---------------------------------------------------------------------------
// Herramienta (hoja imprimible): panel izquierdo con el nombre y el uso, derecha las partes
//   s = { numero, nombre, uso, partes: [{ titulo, items, estilo: 'preguntas'|'checks'|'campos' }], cierre? }
// ---------------------------------------------------------------------------
function herramienta(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = 0.95
  const panelW = 4.15
  // panel izquierdo
  tarjeta(slide, MARGIN, top, panelW, CONTENIDO_BOTTOM - top, { fill: C.tinta })
  slide.addShape('roundRect', { x: MARGIN + 0.3, y: top + 0.32, w: 2.2, h: 0.34, rectRadius: 0.17, fill: { color: C.sage }, line: { type: 'none' } })
  slide.addText(`HERRAMIENTA ${s.numero}`, { x: MARGIN + 0.3, y: top + 0.32, w: 2.2, h: 0.34, align: 'center', valign: 'middle', fontFace: 'Poppins', bold: true, fontSize: 10.5, color: C.tinta, charSpacing: 1, margin: 0 })
  const f = t(d, slide, s.nombre, { x: MARGIN + 0.3, y: top + 0.95, w: panelW - 0.6, h: 2.1, tipo: 'negrita', max: 28, min: 18, color: C.blanco, mult: 0.92, donde: 'herramienta' })
  const yUso = top + 0.95 + Math.min(2.1, f.alto) + 0.25
  t(d, slide, s.uso, { x: MARGIN + 0.3, y: yUso, w: panelW - 0.6, h: CONTENIDO_BOTTOM - yUso - 1.25, tipo: 'serifCursiva', max: 16, min: 11.5, color: C.grisCalido, mult: 1, donde: 'uso' })
  slide.addShape('line', { x: MARGIN + 0.3, y: CONTENIDO_BOTTOM - 1.0, w: 0.9, h: 0, line: { color: C.marca, width: 3 } })
  slide.addText('Hoja imprimible · se entrega a cada participante', { x: MARGIN + 0.3, y: CONTENIDO_BOTTOM - 0.88, w: panelW - 0.6, h: 0.6, fontFace: 'Poppins', fontSize: 10.5, color: C.grisCalido, margin: 0, valign: 'top' })

  // partes (derecha): cada una con la altura que su contenido necesita; con `columnas`, lado a lado
  const x0 = MARGIN + panelW + 0.3
  const wR = CONTENT_W - panelW - 0.3
  const partes = s.partes
  const gap = 0.2
  const CAB = 0.52, PIE = 0.22
  const anchoItem = (estilo, w) => w - 0.6 - (estilo === 'campos' ? 0 : 0.5)
  const sep = (estilo) => (estilo === 'campos' ? 0.24 : 0.14)
  const hItem = (it, estilo, q, w) => M.alto(M.lineas(it, 'regular', q, anchoItem(estilo, w) * M.SEGURIDAD).length, 'regular', q, 0.9)
  const necesidad = (p, q, w) => CAB + p.items.reduce((a, it) => a + hItem(it, p.estilo, q, w) + sep(p.estilo), 0) - sep(p.estilo) + PIE
  const palabrasOk = (q, w) => partes.every((p) => p.items.every((it) => M.palabraMasAncha(it, 'regular', q) <= anchoItem(p.estilo, w) * M.SEGURIDAD))
  const dibujarParte = (p, x, y, w, h, pt) => {
    tarjeta(slide, x, y, w, h)
    slide.addText(p.titulo.toUpperCase(), { x: x + 0.3, y: y + 0.16, w: w - 0.6, h: 0.26, fontFace: 'Poppins', bold: true, fontSize: 10, color: C.marca, charSpacing: 1.2, margin: 0 })
    const ancho = anchoItem(p.estilo, w)
    const dx = p.estilo === 'campos' ? 0 : 0.5
    // los ítems se reparten en el espacio sobrante para que la tarjeta no quede "colgada"
    const util = h - CAB - PIE
    const ocupado = p.items.reduce((a, it) => a + hItem(it, p.estilo, pt, w), 0)
    const paso = p.items.length > 1 ? Math.min((util - ocupado) / (p.items.length - 1), 0.5) : 0
    let cy = y + CAB
    p.items.forEach((it, k) => {
      const hh = hItem(it, p.estilo, pt, w)
      if (p.estilo === 'checks') slide.addShape('roundRect', { x: x + 0.3, y: cy + 0.02, w: 0.22, h: 0.22, rectRadius: 0.04, fill: { color: C.blanco }, line: { color: C.hondo, width: 1.5 } })
      else if (p.estilo === 'campos') slide.addShape('line', { x: x + 0.3, y: cy + hh + Math.min(0.1, paso / 2), w: w - 0.6, h: 0, line: { color: C.grisCalido, width: 1, dashType: 'dash' } })
      else slide.addText(String(k + 1), { x: x + 0.3, y: cy, w: 0.34, h: 0.3, fontFace: 'Poppins', bold: true, fontSize: pt, color: C.marca, margin: 0 })
      slide.addText(it, { x: x + 0.3 + dx, y: cy, w: ancho, h: hh + 0.02, fontFace: 'Poppins', fontSize: pt, color: C.tinta, margin: 0, valign: 'top', lineSpacingMultiple: 0.9, fit: 'none' })
      cy += hh + paso
    })
  }
  const bajoCierre = s.cierre ? 0.95 : 0
  if (s.columnas) {
    const n = partes.length
    const gapC = 0.25
    const wC = (wR - gapC * (n - 1)) / n
    const hC = CONTENIDO_BOTTOM - top - bajoCierre
    let pt = 11
    for (let q = s.max ?? 19; q >= 11 - 1e-9; q -= 0.5) {
      if (partes.every((p) => necesidad(p, q, wC) <= hC) && palabrasOk(q, wC)) { pt = q; break }
    }
    reg(d, pt)
    if (partes.some((p) => necesidad(p, pt, wC) > hC)) aviso(d, 'herramienta', partes[0].items[0], { pt, lineas: partes[0].items, alto: Math.max(...partes.map((p) => necesidad(p, pt, wC))) })
    partes.forEach((p, i) => dibujarParte(p, x0 + i * (wC + gapC), top, wC, hC, pt))
  } else {
    const areaH = CONTENIDO_BOTTOM - top - bajoCierre - gap * (partes.length - 1)
    let pt = 11
    for (let q = s.max ?? 18; q >= 11 - 1e-9; q -= 0.5) {
      if (partes.reduce((a, p) => a + necesidad(p, q, wR), 0) <= areaH && palabrasOk(q, wR)) { pt = q; break }
    }
    reg(d, pt)
    const total = partes.reduce((a, p) => a + necesidad(p, pt, wR), 0)
    if (total > areaH) aviso(d, 'herramienta', partes[0].items[0], { pt, lineas: partes[0].items, alto: total })
    const sobra = Math.max(0, (areaH - total) / partes.length)
    let y = top
    partes.forEach((p) => {
      const h = necesidad(p, pt, wR) + Math.min(sobra, 0.5)
      dibujarParte(p, x0, y, wR, h, pt)
      y += h + gap
    })
  }
  if (s.cierre) {
    const yC = CONTENIDO_BOTTOM - 0.82
    slide.addShape('roundRect', { x: x0, y: yC, w: wR, h: 0.82, rectRadius: 0.1, fill: { color: C.sageSuave }, line: { type: 'none' } })
    t(d, slide, s.cierre, { x: x0 + 0.3, y: yC + 0.08, w: wR - 0.6, h: 0.66, tipo: 'serifCursiva', max: 15, min: 11, color: C.tinta, mult: 1, valign: 'middle', donde: 'cierre' })
  }
}

// ---------------------------------------------------------------------------
// Tabla
// ---------------------------------------------------------------------------
function tabla(d, s) {
  const slide = nueva(d, { notas: s.notas })
  const top = titulo(d, slide, s.kicker, s.titulo)
  const cols = s.cols
  const anchos = s.anchos ?? cols.map(() => CONTENT_W / cols.length)
  const filas = s.filas.length
  const area = CONTENIDO_BOTTOM - top
  const CAB = 0.5
  const tipoCol = (j) => (j === 0 ? 'negrita' : 'regular')
  const MARG = 0.34 // márgenes laterales de la celda
  const altosA = (p) => s.filas.map((f) => Math.max(...f.map((c, j) => M.alto(M.lineas(c, tipoCol(j), p, (anchos[j] - MARG) * M.SEGURIDAD).length, tipoCol(j), p, 1))) + 0.2)
  let pt = s.pt ?? 20
  while (pt > 12 && CAB + altosA(pt).reduce((a, b) => a + b, 0) > area) pt -= 0.5
  const altos = altosA(pt)
  const sobra = Math.max(0, (area - CAB - altos.reduce((a, b) => a + b, 0)) / filas)
  const rowH = altos.map((h) => h + Math.min(sobra, 0.3))
  reg(d, pt)
  const celda = (texto, o = {}) => ({ text: texto, options: { fontFace: 'Poppins', fontSize: pt, color: C.tinta, valign: 'middle', margin: [0.04, 0.12, 0.04, 0.12], ...o } })
  const rows = [
    cols.map((c) => celda(c, { bold: true, color: C.blanco, fill: { color: C.tinta }, fontSize: Math.max(12, pt - 1.5) })),
    ...s.filas.map((f, i) => f.map((c, j) => celda(c, { fill: { color: i % 2 ? C.hueso : C.blanco }, bold: j === 0, color: j === 0 ? C.marca : C.tinta }))),
  ]
  slide.addTable(rows, { x: MARGIN, y: top, w: CONTENT_W, colW: anchos, rowH: [CAB, ...rowH], border: { type: 'solid', pt: 0.5, color: C.grisCalido } })
}

// ---------------------------------------------------------------------------
// Cierre / mensaje central
// ---------------------------------------------------------------------------
function cierre(d, s) {
  const slide = nueva(d, { fondo: C.tinta, chrome: false, notas: s.notas })
  slide.addImage({ path: require('path').join(require('path').dirname(require.resolve('../../curso-pastoral/brand')), 'mark-crema.png'), x: 0.7, y: 0.62, w: 0.6, h: 0.6 })
  slide.addText('ELIAS PACIONE', { x: 1.45, y: 0.64, w: 5, h: 0.3, fontFace: 'Poppins', fontSize: 14, bold: true, color: C.blanco, margin: 0 })
  slide.addText('Psicología con sentido', { x: 1.45, y: 0.94, w: 5, h: 0.26, fontFace: 'Poppins', fontSize: 10, color: C.grisCalido, margin: 0 })
  if (s.kicker) slide.addText(s.kicker.toUpperCase(), { x: 0.9, y: 2.3, w: 10, h: 0.34, fontFace: 'Poppins', bold: true, fontSize: 13, color: C.sage, charSpacing: 3, margin: 0 })
  const f = t(d, slide, s.titulo, { x: 0.9, y: 2.75, w: 11.4, h: 2.2, tipo: 'negrita', max: 38, min: 24, color: C.blanco, mult: 0.95, donde: 'cierre' })
  if (s.texto) t(d, slide, s.texto, { x: 0.9, y: 2.75 + Math.min(2.2, f.alto) + 0.3, w: 10.6, h: 1.7, tipo: 'serifCursiva', max: 20, min: 14, color: C.grisCalido, mult: 1.05, donde: 'cierreTexto' })
  slide.addShape('line', { x: 0.9, y: 6.55, w: 1.1, h: 0, line: { color: C.marca, width: 3 } })
  slide.addText(s.pie ?? 'Programa de formación · Elias Pacione', { x: 0.9, y: 6.7, w: 8, h: 0.3, fontFace: 'Poppins', fontSize: 10.5, color: C.grisCalido, margin: 0 })
}

const TIPOS = { portada, objetivos, agenda, tarjetas, lista, comparacion, puntos, datos, pasos, ciclo, escalera, curva, mapa, hub, frase, claves, herramienta, tabla, cierre }

function agregar(d, spec) {
  const fn = TIPOS[spec.tipo]
  if (!fn) throw new Error(`Tipo de diapositiva desconocido: ${spec.tipo}`)
  fn(d, spec)
  d.tipos[d.n] = spec.tipo
}

module.exports = { Deck, agregar, C, TIPOS }
