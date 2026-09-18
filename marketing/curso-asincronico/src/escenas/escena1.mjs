// ESCENA 1 (0:00–0:07) — "¿Alguna vez te anotaste en algo... pero el horario
// nunca te cerraba?" Interior hogareño de noche: ventana con luna, lámpara
// cálida, persona con la notebook en la falda, planta y taza. Zoom lento
// hacia adentro, todo respira despacio.
import { C, fondo, planta, taza, trazo, solido, seno, seg, lerp, ease } from '../lib.mjs'

export default function escena1(tl, L) {
  const wide = L.W > L.H
  const dur = L.durs[1]

  // Posiciones por formato
  const P = wide
    ? {
        ventana: { x: 340, y: 210, w: 520, h: 430 },
        luna: { cx: 700, cy: 330, r: 46 },
        estrellas: [[430, 310], [560, 410], [790, 480], [500, 560]],
        lampara: { x: 1500, baseY: 890 },
        persona: { cx: 980, baseY: 908 },
        planta: { x: 268, y: 905, s: 1.1 },
        taza: { x: 1305, y: 902, s: 1.05 },
        zoomC: [960, 600],
      }
    : {
        ventana: { x: 250, y: 330, w: 580, h: 440 },
        luna: { cx: 700, cy: 455, r: 50 },
        estrellas: [[330, 430], [470, 545], [755, 625], [400, 690]],
        lampara: { x: 205, baseY: 1420 },
        persona: { cx: 560, baseY: 1415 },
        planta: { x: 895, y: 1610, s: 1.15 },
        taza: { x: 215, y: 1645, s: 1.05 },
        zoomC: [540, 1050],
      }

  const zoom = lerp(1.0, wide ? 1.04 : 1.03, ease.inout(seg(tl, 0, dur)))
  const [zx, zy] = P.zoomC
  const v = P.ventana

  // Noche dentro de la ventana: luna con halo + estrellas que titilan
  const estrellas = P.estrellas
    .map(([x, y], i) => {
      const op = 0.3 + 0.65 * seno(tl, 2.2 + i * 0.7, i * 1.3)
      return `<circle cx="${x}" cy="${y}" r="${5 + (i % 2)}" fill="${C.crema}" opacity="${op.toFixed(2)}"/>`
    })
    .join('')

  const { x: lx, baseY } = P.lampara
  const glowOp = 0.5 + 0.28 * seno(tl, 4.6)

  const { cx, baseY: py } = P.persona
  const respiracion = 1 + 0.014 * seno(tl, 3.6)
  const playOp = 0.7 + 0.3 * seno(tl, 3.1)

  return `
  ${fondo(L, 'marca')}
  <defs>
    <radialGradient id="glowLamp">
      <stop offset="0" stop-color="#FDF8E7" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#FDF8E7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g transform="translate(${zx} ${zy}) scale(${zoom.toFixed(4)}) translate(${-zx} ${-zy})">
    <circle cx="${lx}" cy="${baseY - 385}" r="330" fill="url(#glowLamp)" opacity="${glowOp.toFixed(2)}"/>
    <rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" rx="26" ${solido(C.noche, 10)}/>
    <circle cx="${P.luna.cx}" cy="${P.luna.cy}" r="${P.luna.r + 32}" fill="${C.crema}" opacity="0.15"/>
    <circle cx="${P.luna.cx}" cy="${P.luna.cy}" r="${P.luna.r}" fill="${C.crema}"/>
    ${estrellas}
    <line x1="${lx}" y1="${baseY - 320}" x2="${lx}" y2="${baseY}" ${trazo(10)}/>
    <line x1="${lx - 54}" y1="${baseY}" x2="${lx + 54}" y2="${baseY}" ${trazo(10)}/>
    <path d="M ${lx - 70} ${baseY - 320} L ${lx + 70} ${baseY - 320} L ${lx + 42} ${baseY - 450} L ${lx - 42} ${baseY - 450} Z" ${solido(C.hueso, 10)}/>
    ${planta(P.planta.x, P.planta.y, P.planta.s)}
    <ellipse cx="${cx}" cy="${py - 3}" rx="215" ry="42" ${solido(C.palido, 9)}/>
    <g transform="translate(${cx} ${py}) scale(1 ${respiracion.toFixed(4)}) translate(${-cx} ${-py})">
      <path d="M ${cx - 118} ${py + 2} Q ${cx} ${py - 128} ${cx + 118} ${py + 2} Z" ${solido(C.crema, 10)}/>
      <path d="M ${cx - 72} ${py - 192} Q ${cx} ${py - 254} ${cx + 72} ${py - 192} L ${cx + 100} ${py - 30} Q ${cx} ${py + 4} ${cx - 100} ${py - 30} Z" ${solido(C.sage, 10)}/>
      <circle cx="${cx}" cy="${py - 276}" r="56" ${solido(C.hueso, 10)}/>
      <rect x="${cx - 72}" y="${py - 152}" width="144" height="100" rx="10" ${solido(C.palido, 9)}/>
      <g opacity="${playOp.toFixed(2)}">
        <circle cx="${cx}" cy="${py - 102}" r="17" fill="${C.marca}"/>
        <path d="M ${cx - 6} ${py - 111} L ${cx + 10} ${py - 102} L ${cx - 6} ${py - 93} Z" fill="${C.carta}"/>
      </g>
      <line x1="${cx - 92}" y1="${py - 40}" x2="${cx + 92}" y2="${py - 40}" ${trazo(9)}/>
      <line x1="${cx - 56}" y1="${py - 150}" x2="${cx - 62}" y2="${py - 56}" stroke="${C.hueso}" stroke-width="17" stroke-linecap="round"/>
      <line x1="${cx + 56}" y1="${py - 150}" x2="${cx + 62}" y2="${py - 56}" stroke="${C.hueso}" stroke-width="17" stroke-linecap="round"/>
    </g>
    ${taza(P.taza.x, P.taza.y, P.taza.s, tl / 2.2)}
  </g>`
}
