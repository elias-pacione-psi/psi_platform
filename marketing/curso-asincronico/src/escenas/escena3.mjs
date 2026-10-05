// ESCENA 3 (0:16–0:25) — "Nada de clases en vivo ni fechas fijas de
// inscripción. Entrás con tu usuario, avanzás lección por lección, y retomás
// justo donde quedaste." Una mano toca la lección 2, la barra de progreso
// avanza 32%→68%, aparece la tilde y el pill "Continuar" en la lección 3
// (retomar donde quedaste).
import { C, fondo, txt, glifo, mano, solido, seno, seg, lerp, ease, on } from '../lib.mjs'

const LECCIONES = [
  { titulo: 'Lección 1 · Bienvenida', estado: 'hecha' },
  { titulo: 'Lección 2 · Conceptos clave', estado: 'tocada' },
  { titulo: 'Lección 3 · Ejercicio práctico', estado: 'siguiente' },
]

// Tiempos del guion dentro de la escena (la voz dice "avanzás lección por
// lección" cerca de la mitad)
const T_ENTRA_MANO = 3.2
const T_TAP = 4.3
const T_BARRA = [4.9, 6.5]
const T_PILL = 7.0
const T_SALE_MANO = 5.5

function fila(x, y, w, h, leccion, tl) {
  const cy = y + h / 2
  let icono
  if (leccion.estado === 'hecha') {
    icono = `<g transform="translate(${x + 62} ${cy})">${glifo('tilde', 26, C.sage)}</g>`
  } else if (leccion.estado === 'tocada') {
    const u = ease.back(seg(tl, T_TAP, T_TAP + 0.5))
    icono =
      tl < T_TAP
        ? `<g transform="translate(${x + 62} ${cy})">${glifo('play', 26)}</g>`
        : `<g transform="translate(${x + 62} ${cy}) scale(${Math.max(u, 0.001).toFixed(3)})">${glifo('tilde', 26, C.sage)}</g>`
  } else {
    icono = `<g transform="translate(${x + 62} ${cy})" opacity="0.45">${glifo('play', 26)}</g>`
  }
  const completada = leccion.estado === 'hecha' || (leccion.estado === 'tocada' && tl >= T_TAP)
  const opTexto = completada ? 0.6 : leccion.estado === 'siguiente' ? 0.85 : 1
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" ${solido(C.carta, 9)}/>
    ${icono}
    ${txt(x + 124, cy + 10, leccion.titulo, { size: 30, weight: 600, anchor: 'start', opacity: opTexto })}
  </g>`
}

export default function escena3(tl, L) {
  const wide = L.W > L.H

  // progreso animado 32% → 68%
  const p = ease.inout(seg(tl, T_BARRA[0], T_BARRA[1]))
  const porcentaje = Math.round(lerp(32, 68, p))

  // mano: entra, toca el play de la lección 2, sale en cuanto llena la barra
  let manoSvg = ''
  let ripple = ''
  const tap = wide ? { x: 342, y: 520 } : { x: 142, y: 805 }
  if (tl >= T_ENTRA_MANO && tl <= T_SALE_MANO + 0.6) {
    const entra = ease.out(seg(tl, T_ENTRA_MANO, T_ENTRA_MANO + 0.7))
    const sale = ease.in(seg(tl, T_SALE_MANO, T_SALE_MANO + 0.6))
    const dy = (1 - entra) * 340 + sale * 340
    const presion = seg(tl, T_TAP - 0.12, T_TAP) * (1 - seg(tl, T_TAP + 0.08, T_TAP + 0.25))
    manoSvg = mano(tap.x, tap.y + 74 + dy, { escala: 0.7, presion })
  }
  if (tl >= T_TAP) {
    const u = seg(tl, T_TAP, T_TAP + 0.6)
    if (u < 1) {
      ripple = `<circle cx="${tap.x}" cy="${tap.y}" r="${lerp(22, 92, ease.out(u)).toFixed(1)}" fill="none" stroke="${C.marca}" stroke-width="6" opacity="${(0.5 * (1 - u)).toFixed(3)}"/>`
    }
  }

  let cuerpo
  if (wide) {
    const filas = LECCIONES.map((l, i) => fila(280, 300 + i * 160, 820, 120, l, tl)).join('')
    const barraW = 480
    const relleno = Math.max(barraW * lerp(0.32, 0.68, p), 19)
    const pill = on(tl, T_PILL, 0.5)
    cuerpo = `
    ${txt(280, 238, 'Lecciones', { size: 36, weight: 700, anchor: 'start' })}
    ${filas}
    <g transform="translate(${(1 - pill) * 24} 0)" opacity="${pill.toFixed(3)}">
      <rect x="892" y="648" width="190" height="64" rx="32" fill="${C.marca}"/>
      ${txt(987, 690, 'Continuar', { size: 25, weight: 600, fill: C.hueso })}
    </g>
    ${txt(1210, 360, 'Tu progreso', { size: 42, weight: 700, anchor: 'start' })}
    <rect x="1210" y="410" width="${barraW}" height="38" rx="19" fill="${C.palido}"/>
    <rect x="1210" y="410" width="${relleno.toFixed(1)}" height="38" rx="${Math.min(19, relleno / 2).toFixed(1)}" fill="${C.marca}"/>
    ${txt(1210, 538, `${porcentaje}%`, { size: 68, weight: 700, anchor: 'start' })}
    ${txt(1210, 588, 'lecciones completadas', { size: 22, weight: 400, fill: C.apagado, anchor: 'start' })}
    ${ripple}
    ${manoSvg}`
  } else {
    const filas = LECCIONES.map((l, i) => fila(80, 570 + i * 170, 920, 130, l, tl)).join('')
    const barraW = 920
    const relleno = Math.max(barraW * lerp(0.32, 0.68, p), 22)
    const pill = on(tl, T_PILL, 0.5)
    cuerpo = `
    ${txt(80, 502, 'Lecciones', { size: 40, weight: 700, anchor: 'start' })}
    ${filas}
    <g transform="translate(${(1 - pill) * 24} 0)" opacity="${pill.toFixed(3)}">
      <rect x="762" y="943" width="200" height="64" rx="32" fill="${C.marca}"/>
      ${txt(862, 985, 'Continuar', { size: 26, weight: 600, fill: C.hueso })}
    </g>
    ${txt(80, 1150, 'Tu progreso', { size: 44, weight: 700, anchor: 'start' })}
    <rect x="80" y="1200" width="${barraW}" height="44" rx="22" fill="${C.palido}"/>
    <rect x="80" y="1200" width="${relleno.toFixed(1)}" height="44" rx="${Math.min(22, relleno / 2).toFixed(1)}" fill="${C.marca}"/>
    ${txt(80, 1340, `${porcentaje}%`, { size: 76, weight: 700, anchor: 'start' })}
    ${txt(80, 1392, 'lecciones completadas', { size: 24, weight: 400, fill: C.apagado, anchor: 'start' })}
    ${ripple}
    ${manoSvg}`
  }

  return `
  ${fondo(L, 'marca')}
  ${cuerpo}`
}
