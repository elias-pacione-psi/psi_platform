// Biblioteca compartida del video: paleta de marca, helpers de animación
// (easing, seg, lerp) y piezas de ilustración en el MISMO idioma visual que
// generar-ilustraciones.mjs del sitio (trazo tinta 8-10 con remates redondos,
// superficies crema/pálido/sage, personas sin cara). Si se toca la paleta o el
// estilo de trazo, hay que tocarlo en los dos lados.
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
  // overshoot suave para "pops" de UI (chips, tildes, botón)
  back: (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
}

// 0→1 entre t0 y t0+d con easing; pensado para entradas
export const on = (t, t0, d = 0.5, e = ease.out) => e(seg(t, t0, t0 + d))

// Onda senoidal 0..1 con período p y fase f
export const seno = (t, p, f = 0) => 0.5 + 0.5 * Math.sin((2 * Math.PI * (t + f)) / p)

const f = (n) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// SVG básico (mismo estilo que el sitio)
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

// Fondo de marca: crema + lavado diagonal (como el de las ilustraciones del
// sitio) + círculo tenue. `variante` = marca | sage. `opts.lavado` escala la
// fuerza del lavado y `opts.circulo` apaga el círculo (cierre limpio).
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

// Las tres barras inclinadas del isotipo, firma de la serie de ilustraciones.
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

// Taza con vapor animado: `fase` (0..1) sube y desvanece las dos volutas.
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

// Libro abierto de frente (el del sitio), con `pagina` 0..1 que rota una hoja
// de derecha a izquierda sobre el lomo.
export function libro(x, y, s = 1, pagina = 0) {
  const renglon = (dx, i) =>
    `<line x1="${dx}" y1="${34 + i * 26}" x2="${dx + 150}" y2="${28 + i * 26}" stroke="${C.tintaSuave}" stroke-width="8" stroke-linecap="round"/>`
  let hoja = ''
  if (pagina > 0 && pagina < 1) {
    const ang = -160 * ease.inout(pagina)
    const op = pagina > 0.8 ? 1 - seg(pagina, 0.8, 1) : 1
    hoja = `<g transform="rotate(${f(ang)} 0 0)" opacity="${f(op)}">
      <path d="M 0 -66 C 80 -96 180 -96 260 -66 L 260 66 C 180 36 80 36 0 66 Z" ${solido(C.carta, 9)}/>
      ${[0, 1, 2].map((i) => renglon(86, i)).join('')}
    </g>`
  }
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M 0 -66 C -80 -96 -180 -96 -260 -66 L -260 66 C -180 36 -80 36 0 66 Z" ${solido(C.hueso, 10)}/>
    <path d="M 0 -66 C 80 -96 180 -96 260 -66 L 260 66 C 180 36 80 36 0 66 Z" ${solido(C.hueso, 10)}/>
    <line x1="0" y1="-66" x2="0" y2="66" ${trazo(10)}/>
    ${[0, 1, 2].map((i) => renglon(-236, i)).join('')}
    ${[0, 1, 2].map((i) => renglon(86, i)).join('')}
    ${hoja}
  </g>`
}

// Glifos de ícono (play / lectura / ejercicio / tilde) centrados en (0,0).
export function glifo(tipo, r = 30, color = C.marca, trazoColor = C.carta) {
  const g = {
    play: `<circle r="${r}" fill="${color}"/>
           <path d="M ${-r * 0.32} ${-r * 0.5} L ${r * 0.55} 0 L ${-r * 0.32} ${r * 0.5} Z" fill="${trazoColor}"/>`,
    lectura: `<circle r="${r}" fill="${color}"/>
              ${[-0.45, -0.05, 0.35].map((dy, i) => `<line x1="${-r * 0.52}" y1="${r * dy}" x2="${i === 2 ? r * 0.1 : r * 0.52}" y2="${r * dy}" stroke="${trazoColor}" stroke-width="${r * 0.22}" stroke-linecap="round"/>`).join('')}`,
    ejercicio: `<circle r="${r}" fill="${color}"/>
              <line x1="${-r * 0.22}" y1="${r * 0.22}" x2="${r * 0.38}" y2="${-r * 0.38}" stroke="${trazoColor}" stroke-width="${r * 0.3}" stroke-linecap="round"/>
              <path d="M ${-r * 0.5} ${r * 0.5} L ${-r * 0.14} ${r * 0.4} L ${-r * 0.4} ${r * 0.14} Z" fill="${trazoColor}"/>`,
    tilde: `<circle r="${r}" fill="${color}"/>
            <path d="M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.38} L ${r * 0.48} ${-r * 0.34}" fill="none" stroke="${trazoColor}" stroke-width="${r * 0.24}" ${REMATE}/>`,
  }
  return g[tipo]
}

// Mano plana estilo editorial señalando hacia arriba (para el "tap" de la
// escena 3): dedo índice + palma + pulgar, borde tinta por debajo y relleno
// hueso encima. El punto de contacto del dedo queda en (x, y - 105*escala).
export function mano(x, y, { escala = 1, rot = 0, presion = 0 } = {}) {
  const dedo = (color, ancho) =>
    `<line x1="0" y1="-8" x2="0" y2="-105" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>`
  const pulgar = (color, ancho) =>
    `<line x1="36" y1="18" x2="68" y2="-18" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/>`
  const esc = escala * (1 - 0.08 * presion)
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${f(esc)})">
    ${dedo(C.tinta, 42)}${pulgar(C.tinta, 34)}
    <circle cx="8" cy="26" r="48" fill="${C.hueso}" stroke="${C.tinta}" stroke-width="9"/>
    ${dedo(C.hueso, 28)}${pulgar(C.hueso, 21)}
  </g>`
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
let _marca = null
export function marcaDataUri() {
  if (!_marca) {
    _marca = 'data:image/png;base64,' + readFileSync('assets/mark.png').toString('base64')
  }
  return _marca
}

// Isotipo de marca centrado en (cx, cy) con ancho `w` (el PNG es 1069×703).
export function isotipo(cx, cy, w, opacity = 1) {
  const h = (w * 703) / 1069
  return `<image href="${marcaDataUri()}" xlink:href="${marcaDataUri()}" x="${f(cx - w / 2)}" y="${f(cy - h / 2)}" width="${f(w)}" height="${f(h)}" opacity="${f(opacity)}"/>`
}
