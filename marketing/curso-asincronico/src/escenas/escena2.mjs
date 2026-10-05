// ESCENA 2 (0:07–0:16) — "Un curso asincrónico es contenido grabado: videos,
// lecturas, ejercicios, que vas viendo cuando vos querés, a tu propio ritmo."
// La app: ventana blanca con módulo/lecciones, player en tinta, botón
// Continuar, y los chips Videos/Lecturas/Ejercicios que aparecen en sincronía
// con la voz (ctx.chips = segundos locales de cada palabra).
import { C, fondo, trazo, solido, txt, glifo, seno, seg, lerp, ease, on } from '../lib.mjs'

const LECCIONES = [
  { titulo: 'Lección 1 · Bienvenida', sub: 'Video · 12 min', icono: 'play' },
  { titulo: 'Lección 2 · Conceptos clave', sub: 'Lectura · 8 min', icono: 'lectura' },
  { titulo: 'Lección 3 · Ejercicio práctico', sub: 'Ejercicio · 15 min', icono: 'ejercicio' },
]

function fila(x, y, w, h, leccion, u) {
  const dy = (1 - u) * 26
  return `<g transform="translate(0 ${dy.toFixed(1)})" opacity="${u.toFixed(3)}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" ${solido(C.crema, 8)}/>
    <g transform="translate(${x + 56} ${y + h / 2})">${glifo(leccion.icono, 24)}</g>
    ${txt(x + 110, y + h / 2 - 4, leccion.titulo, { size: 27, weight: 600, anchor: 'start' })}
    ${txt(x + 110, y + h / 2 + 28, leccion.sub, { size: 21, weight: 400, fill: C.apagado, anchor: 'start' })}
  </g>`
}

function chip(cx, cy, w, label, icono, t0, tl) {
  const u = ease.back(seg(tl, t0, t0 + 0.55))
  if (u <= 0) return ''
  return `<g transform="translate(${cx} ${cy}) scale(${Math.max(u, 0.001).toFixed(3)}) translate(${-cx} ${-cy})" opacity="${Math.min(1, u).toFixed(3)}">
    <rect x="${cx - w / 2}" y="${cy - 34}" width="${w}" height="68" rx="34" ${solido(C.palido, 8)}/>
    <g transform="translate(${cx - w / 2 + 48} ${cy})">${glifo(icono, 17)}</g>
    ${txt(cx - w / 2 + 80, cy + 10, label, { size: 28, weight: 600, anchor: 'start' })}
  </g>`
}

export default function escena2(tl, L, ctx) {
  const wide = L.W > L.H
  const flote = 5 * Math.sin((2 * Math.PI * tl) / 5.5)
  const entrada = (1 - on(tl, 0.05, 0.8)) * 46 + flote
  const opVentana = on(tl, 0.05, 0.6)
  const [cv, cl, ce] = ctx.chips // segundos locales: videos / lecturas / ejercicios

  let cuerpo
  if (wide) {
    const filas = LECCIONES.map((l, i) =>
      fila(396, 268 + i * 120, 700, 96, l, on(tl, 0.5 + i * 0.16, 0.55)),
    ).join('')
    const pulso = 1 + 0.05 * seno(tl, 2.8)
    const progreso = 304 * 0.42
    cuerpo = `
    <rect x="340" y="140" width="1240" height="800" rx="28" ${solido(C.carta, 10)}/>
    <circle cx="392" cy="196" r="8" fill="${C.tinta}" opacity="0.22"/>
    <circle cx="424" cy="196" r="8" fill="${C.tinta}" opacity="0.22"/>
    <circle cx="456" cy="196" r="8" fill="${C.tinta}" opacity="0.22"/>
    <rect x="500" y="174" width="300" height="46" rx="23" fill="${C.palido}"/>
    ${txt(650, 205, 'Tu curso', { size: 26, weight: 600 })}
    <circle cx="1480" cy="197" r="22" fill="${C.crema}" stroke="${C.tinta}" stroke-width="8"/>
    <circle cx="1480" cy="190" r="7" fill="${C.marca}"/>
    <path d="M 1468 211 q 12 -14 24 0" fill="none" stroke="${C.marca}" stroke-width="5" stroke-linecap="round"/>
    ${filas}
    <rect x="1140" y="268" width="384" height="336" rx="20" fill="${C.tinta}"/>
    <g transform="translate(1332 400) scale(${pulso.toFixed(3)})">
      <circle r="46" fill="${C.crema}"/>
      <path d="M -14 -22 L 26 0 L -14 22 Z" fill="${C.tinta}"/>
    </g>
    <line x1="1180" y1="510" x2="1484" y2="510" stroke="${C.crema}" stroke-width="10" stroke-linecap="round" opacity="0.25"/>
    <line x1="1180" y1="510" x2="${1180 + progreso}" y2="510" stroke="${C.crema}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
    ${txt(1332, 566, 'Módulo 1 · Introducción', { size: 24, weight: 500, fill: C.crema })}
    <g opacity="${on(tl, 1.1, 0.5).toFixed(3)}">
      <rect x="1140" y="640" width="384" height="84" rx="42" fill="${C.marca}"/>
      ${txt(1332, 695, 'Continuar', { size: 30, weight: 600, fill: C.hueso })}
    </g>
    ${chip(600, 834, 230, 'Videos', 'play', cv - 0.05, tl)}
    ${chip(880, 834, 260, 'Lecturas', 'lectura', cl - 0.05, tl)}
    ${chip(1185, 834, 300, 'Ejercicios', 'ejercicio', ce - 0.05, tl)}`
  } else {
    const filas = LECCIONES.map((l, i) =>
      fila(100, 590 + i * 120, 610, 96, l, on(tl, 0.5 + i * 0.16, 0.55)),
    ).join('')
    const pulso = 1 + 0.05 * seno(tl, 2.8)
    cuerpo = `
    <rect x="60" y="470" width="960" height="1080" rx="28" ${solido(C.carta, 10)}/>
    <circle cx="112" cy="526" r="8" fill="${C.tinta}" opacity="0.22"/>
    <circle cx="144" cy="526" r="8" fill="${C.tinta}" opacity="0.22"/>
    <circle cx="176" cy="526" r="8" fill="${C.tinta}" opacity="0.22"/>
    <rect x="210" y="504" width="280" height="46" rx="23" fill="${C.palido}"/>
    ${txt(350, 535, 'Tu curso', { size: 26, weight: 600 })}
    <circle cx="950" cy="527" r="22" fill="${C.crema}" stroke="${C.tinta}" stroke-width="8"/>
    <circle cx="950" cy="520" r="7" fill="${C.marca}"/>
    <path d="M 938 541 q 12 -14 24 0" fill="none" stroke="${C.marca}" stroke-width="5" stroke-linecap="round"/>
    ${filas}
    <rect x="100" y="950" width="880" height="300" rx="20" fill="${C.tinta}"/>
    ${txt(540, 1022, 'Módulo 1 · Introducción', { size: 26, weight: 500, fill: C.crema })}
    <g transform="translate(540 1112) scale(${pulso.toFixed(3)})">
      <circle r="46" fill="${C.crema}"/>
      <path d="M -14 -22 L 26 0 L -14 22 Z" fill="${C.tinta}"/>
    </g>
    <line x1="200" y1="1212" x2="880" y2="1212" stroke="${C.crema}" stroke-width="10" stroke-linecap="round" opacity="0.25"/>
    <line x1="200" y1="1212" x2="${200 + 680 * 0.42}" y2="1212" stroke="${C.crema}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
    <g opacity="${on(tl, 1.1, 0.5).toFixed(3)}">
      <rect x="300" y="1296" width="480" height="88" rx="44" fill="${C.marca}"/>
      ${txt(540, 1352, 'Continuar', { size: 32, weight: 600, fill: C.hueso })}
    </g>
    ${chip(200, 1454, 262, 'Videos', 'play', cv - 0.05, tl)}
    ${chip(540, 1454, 282, 'Lecturas', 'lectura', cl - 0.05, tl)}
    ${chip(864, 1454, 292, 'Ejercicios', 'ejercicio', ce - 0.05, tl)}`
  }

  return `
  ${fondo(L, 'sage')}
  <g transform="translate(0 ${entrada.toFixed(1)})" opacity="${opVentana.toFixed(3)}">
    <rect x="${wide ? 348 : 68}" y="${wide ? 158 : 488}" width="${wide ? 1240 : 960}" height="${wide ? 800 : 1080}" rx="30" fill="${C.tinta}" opacity="0.06"/>
    ${cuerpo}
  </g>`
}
