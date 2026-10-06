// Biblioteca compartida de los videos de features. Los helpers de animación y
// las piezas base son los mismos de marketing/curso-asincronico/src/lib.mjs
// (misma estética: trazo tinta 8-10, remates redondos, personas sin cara).
// Lo específico de acá: `persona`, `globo` y `sillon`, portados del script
// generar-ilustraciones.mjs del sitio. Las fuentes y el isotipo se leen de la
// carpeta hermana curso-asincronico (no se duplican).
import { readFileSync } from 'node:fs'

export const C = {
  crema: '#F1F0EB',
  hueso: '#F7F6F3',
  carta: '#FFFFFF',
  tinta: '#2F3E46',
  tintaSuave: 'rgba(47,62,70,0.28)',
  apagado: '#5F6D77',
  marca: '#4E6478',
  sage: '#A8B79F',
  sageHondo: '#7F95A6',
  palido: '#D6DEE5',
  noche: '#26323A',
}

// ---------------------------------------------------------------------------
// Animación
// ---------------------------------------------------------------------------
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0))
export const lerp = (a, b, u) => a + (b - a) * u

export const ease = {
  linear: (t) => t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inout: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
}

export const on = (t, t0, d = 0.5, e = ease.out) => e(seg(t, t0, t0 + d))
export const seno = (t, p, f = 0) => 0.5 + 0.5 * Math.sin((2 * Math.PI * (t + f)) / p)
export const f = (n) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// SVG básico
// ---------------------------------------------------------------------------
const REMATE = 'stroke-linecap="round" stroke-linejoin="round"'
export const trazo = (ancho = 10, color = C.tinta) =>
  `fill="none" stroke="${color}" stroke-width="${ancho}" ${REMATE}`
export const solido = (relleno, ancho = 10, color = C.tinta) =>
  `fill="${relleno}" stroke="${color}" stroke-width="${ancho}" ${REMATE}`

export function txt(x, y, contenido, o = {}) {
  const {
    size = 48,
    weight = 600,
    family = 'Poppins',
    fill = C.tinta,
    anchor = 'middle',
    italic = false,
    opacity = 1,
    spacing,
  } = o
  return `<text x="${f(x)}" y="${f(y)}" font-family="${family}" font-weight="${weight}" font-size="${size}" fill="${fill}" text-anchor="${anchor}"${italic ? ' font-style="italic"' : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${opacity !== 1 ? ` opacity="${f(opacity)}"` : ''}>${contenido}</text>`
}

export function fondo(L, variante = 'marca', opts = {}) {
  const { lavado = 1, circulo = true } = opts
  const color = variante === 'sage' ? C.sage : C.marca
  const cx = L.W * 0.84
  const cy = L.H * 0.16
  return `
  <defs>
    <linearGradient id="lavado" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity="${0.2 * lavado}"/>
      <stop offset="0.55" stop-color="${color}" stop-opacity="${0.06 * lavado}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${L.W}" height="${L.H}" fill="${C.crema}"/>
  <rect width="${L.W}" height="${L.H}" fill="url(#lavado)"/>
  ${circulo ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(L.W * 0.13)}" fill="${C.sageHondo}" opacity="0.10"/>` : ''}`
}

export function firmaMarca(x, y, alto = 84, opacidad = 0.14) {
  const barra = (i) => {
    const dx = i * 38
    return `<line x1="${x + dx + 26}" y1="${y}" x2="${x + dx}" y2="${y + alto}" stroke="${C.tinta}" stroke-width="16" stroke-linecap="round"/>`
  }
  return `<g opacity="${opacidad}">${barra(0)}${barra(1)}${barra(2)}</g>`
}

export function planta(x, y, s = 1) {
  const hoja = (giro) =>
    `<ellipse cx="0" cy="${-56 * s}" rx="${17 * s}" ry="${44 * s}" transform="rotate(${giro})" ${solido(C.sage, 8)}/>`
  return `<g transform="translate(${f(x)} ${f(y)})">
    <line x1="0" y1="0" x2="0" y2="${-64 * s}" ${trazo(7)}/>
    ${hoja(-26)}${hoja(24)}${hoja(0)}
    <path d="M ${-38 * s} 0 L ${38 * s} 0 L ${28 * s} ${62 * s} L ${-28 * s} ${62 * s} Z" ${solido(C.palido, 9)}/>
  </g>`
}

export function taza(x, y, s = 1, fase = 0) {
  const vapor = (dx, desfase) => {
    const u = (fase + desfase) % 1
    const dy = -14 * u
    const op = 0.55 * Math.sin(Math.PI * u)
    return `<path d="M ${dx} -14 q -6 -22 8 -30" transform="translate(0 ${f(dy)})" opacity="${f(op)}" ${trazo(7)}/>`
  }
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    ${vapor(-16, 0)}${vapor(10, 0.45)}
    <path d="M -30 0 L 30 0 L 23 44 L -23 44 Z" ${solido(C.hueso, 9)}/>
    <path d="M 30 8 q 24 12 0 26" ${trazo(9)}/>
  </g>`
}

// ---------------------------------------------------------------------------
// Piezas portadas de generar-ilustraciones.mjs (mismo dibujo del sitio)
// ---------------------------------------------------------------------------

// Persona: cabeza y hombros, sin cara.
export function persona(x, y, { s = 1, color } = {}) {
  const relleno = color ?? C.crema
  const r = 34 * s
  const hombroY = y + 50 * s
  const baseY = y + 122 * s
  const mitad = 52 * s
  return `<g>
    <path d="M ${x - mitad} ${baseY} Q ${x - mitad} ${hombroY} ${x} ${hombroY} Q ${x + mitad} ${hombroY} ${x + mitad} ${baseY} Z" ${solido(relleno)}/>
    <circle cx="${x}" cy="${y}" r="${r}" ${solido(relleno)}/>
  </g>`
}

// Globo de diálogo con la cola incluida en el contorno.
export function globo(x, y, w, h, { colaX, color, opacidad = 0.3, r = 38 }) {
  const d = [
    `M ${x + r} ${y}`,
    `H ${x + w - r}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${colaX + 26}`,
    `L ${colaX} ${y + h + 54}`,
    `L ${colaX - 26} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ')
  return `<path d="${d}" fill="${color}" fill-opacity="${opacidad}" stroke="${C.tinta}" stroke-width="8" ${REMATE}/>`
}

// Sillón de perfil mirando a la derecha; `espejado` lo da vuelta.
export function sillon(x, y, { s = 1, espejado = false, relleno } = {}) {
  const cuerpo = relleno ?? C.crema
  return `<g transform="translate(${x} ${y}) scale(${espejado ? -s : s} ${s})">
    <line x1="-50" y1="94" x2="-58" y2="142" ${trazo(9)}/>
    <line x1="74" y1="94" x2="84" y2="142" ${trazo(9)}/>
    <rect x="-90" y="-146" width="84" height="198" rx="38" ${solido(cuerpo)}/>
    <rect x="-90" y="26" width="186" height="70" rx="32" ${solido(cuerpo)}/>
    <rect x="58" y="-24" width="48" height="66" rx="23" ${solido(C.palido)}/>
  </g>`
}

// ---------------------------------------------------------------------------
// Isotipo (el PNG real de public/brand, vía la carpeta hermana)
// ---------------------------------------------------------------------------
const MARCA = '../curso-asincronico/assets/mark.png'
let _marca = null
export function marcaDataUri() {
  if (!_marca) {
    _marca = 'data:image/png;base64,' + readFileSync(MARCA).toString('base64')
  }
  return _marca
}

// Isotipo centrado en (cx, cy) con ancho `w` (el PNG es 1069×703).
export function isotipo(cx, cy, w, opacity = 1) {
  const h = (w * 703) / 1069
  return `<image href="${marcaDataUri()}" xlink:href="${marcaDataUri()}" x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" opacity="${f(opacity)}"/>`
}
