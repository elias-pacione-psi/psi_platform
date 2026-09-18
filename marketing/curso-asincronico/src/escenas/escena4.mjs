// ESCENA 4 (0:25–0:33) — "¿Tenés la agenda a full? ¿Preferís estudiar solo,
// sin la dinámica de un grupo? Este formato es para vos." Dos viñetas: una
// persona con reloj/calendario/horarios flotando alrededor (movimiento
// nervioso) y otra sentada leyendo en calma (movimiento lento).
import { C, fondo, txt, trazo, solido, libro, planta, taza, seno, seg, ease } from '../lib.mjs'

// Viñeta A: agenda apretada. (cx, cy) = centro del círculo de fondo.
function agenda(cx, cy, r, tl) {
  const relojX = cx + 225
  const relojY = cy - 235 + 7 * Math.sin((2 * Math.PI * tl) / 3.4)
  const angMin = -Math.PI / 2 + 2 * Math.PI * (tl / 3) // una vuelta cada 3 s: apuro
  const angHora = -Math.PI / 2 + 2 * Math.PI * (tl / 36)
  const giroCal = -7 + 3 * Math.sin((2 * Math.PI * tl) / 2.6)
  const tarjetaY = cy + 42 + 9 * Math.sin((2 * Math.PI * tl) / 2.9 + 1)

  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.sage}" opacity="0.32"/>
  <line x1="${cx - 140}" y1="${cy + 240}" x2="${cx + 140}" y2="${cy + 240}" ${trazo(8)}/>
  <path d="M ${cx - 68} ${cy - 32} Q ${cx} ${cy - 64} ${cx + 68} ${cy - 32} L ${cx + 88} ${cy + 152} L ${cx - 88} ${cy + 152} Z" ${solido(C.crema, 10)}/>
  <circle cx="${cx}" cy="${cy - 112}" r="52" ${solido(C.hueso, 10)}/>
  <line x1="${cx - 32}" y1="${cy + 152}" x2="${cx - 32}" y2="${cy + 236}" stroke="${C.tinta}" stroke-width="16" stroke-linecap="round"/>
  <line x1="${cx + 32}" y1="${cy + 152}" x2="${cx + 32}" y2="${cy + 236}" stroke="${C.tinta}" stroke-width="16" stroke-linecap="round"/>
  <line x1="${cx - 46}" y1="${cy + 238}" x2="${cx - 18}" y2="${cy + 238}" ${trazo(10)}/>
  <line x1="${cx + 18}" y1="${cy + 238}" x2="${cx + 46}" y2="${cy + 238}" ${trazo(10)}/>
  <g transform="translate(${relojX} ${relojY.toFixed(1)})">
    <circle r="62" ${solido(C.hueso, 9)}/>
    <line x1="0" y1="0" x2="${(30 * Math.cos(angHora)).toFixed(1)}" y2="${(30 * Math.sin(angHora)).toFixed(1)}" ${trazo(8)}/>
    <line x1="0" y1="0" x2="${(46 * Math.cos(angMin)).toFixed(1)}" y2="${(46 * Math.sin(angMin)).toFixed(1)}" ${trazo(6)}/>
    <circle r="5" fill="${C.tinta}"/>
  </g>
  <g transform="translate(${cx - 235} ${cy + 55}) rotate(${giroCal.toFixed(1)})">
    <rect x="-60" y="-55" width="120" height="110" rx="12" ${solido(C.crema, 9)}/>
    <line x1="-25" y1="-70" x2="-25" y2="-48" ${trazo(8)}/>
    <line x1="25" y1="-70" x2="25" y2="-48" ${trazo(8)}/>
    <line x1="-40" y1="-10" x2="40" y2="-10" stroke="${C.tintaSuave}" stroke-width="7" stroke-linecap="round"/>
    <line x1="-40" y1="22" x2="40" y2="22" stroke="${C.tintaSuave}" stroke-width="7" stroke-linecap="round"/>
  </g>
  <g transform="translate(${cx + 198} ${tarjetaY.toFixed(1)}) rotate(6)">
    <rect x="-85" y="-32" width="170" height="64" rx="32" ${solido(C.carta, 8)}/>
    <line x1="-52" y1="-8" x2="34" y2="-8" stroke="${C.palido}" stroke-width="10" stroke-linecap="round"/>
    <line x1="-52" y1="14" x2="12" y2="14" stroke="${C.palido}" stroke-width="10" stroke-linecap="round"/>
  </g>`
}

// Viñeta B: lectura en calma. (cx, cy) = centro del círculo de fondo.
function lectura(cx, cy, r, tl) {
  const py = cy + 252 // base del puf
  const respiracion = 1 + 0.012 * seno(tl, 3.8)
  // dos pasadas de página por escena
  const pagina = tl < 5.5 ? seg(tl, 3.6, 4.5) : seg(tl, 7.0, 7.9)
  return `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.palido}" opacity="0.55"/>
  <ellipse cx="${cx}" cy="${py - 2}" rx="190" ry="36" ${solido(C.carta, 9)}/>
  <g transform="translate(${cx} ${py}) scale(1 ${respiracion.toFixed(4)}) translate(${-cx} ${-py})">
    <path d="M ${cx - 108} ${py + 2} Q ${cx} ${py - 96} ${cx + 108} ${py + 2} Z" ${solido(C.crema, 10)}/>
    <path d="M ${cx - 52} ${py - 172} Q ${cx} ${py - 202} ${cx + 52} ${py - 172} L ${cx + 80} ${py - 22} Q ${cx} ${py + 6} ${cx - 80} ${py - 22} Z" ${solido(C.sage, 10)}/>
    <circle cx="${cx}" cy="${py - 256}" r="50" ${solido(C.hueso, 10)}/>
    <line x1="${cx - 44}" y1="${py - 144}" x2="${cx - 78}" y2="${py - 98}" stroke="${C.hueso}" stroke-width="16" stroke-linecap="round"/>
    <line x1="${cx + 44}" y1="${py - 144}" x2="${cx + 78}" y2="${py - 98}" stroke="${C.hueso}" stroke-width="16" stroke-linecap="round"/>
    ${libro(cx, py - 88, 0.42, pagina)}
  </g>
  ${planta(cx + 205, py - 6, 0.85)}
  ${taza(cx - 195, py - 10, 0.8, tl / 2.4)}`
}

export default function escena4(tl, L) {
  const wide = L.W > L.H
  const a = wide ? { cx: 580, cy: 560, r: 330 } : { cx: 540, cy: 545, r: 305 }
  const b = wide ? { cx: 1360, cy: 560, r: 330 } : { cx: 540, cy: 1395, r: 305 }

  // Entrada suave de cada viñeta (aparecen con la pregunta que las nombra)
  const ua = ease.out(seg(tl, 0.1, 0.8))
  const ub = ease.out(seg(tl, 0.4, 1.1))

  return `
  ${fondo(L, 'sage')}
  <g opacity="${ua.toFixed(3)}" transform="translate(0 ${((1 - ua) * 30).toFixed(1)})">
    ${agenda(a.cx, a.cy, a.r, tl)}
  </g>
  <g opacity="${ub.toFixed(3)}" transform="translate(0 ${((1 - ub) * 30).toFixed(1)})">
    ${lectura(b.cx, b.cy, b.r, tl)}
  </g>`
}
