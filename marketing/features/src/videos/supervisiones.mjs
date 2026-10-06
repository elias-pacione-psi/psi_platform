// Video "Supervisiones" (mudo): título con el copy del hero de la página + la
// viñeta charla (dos colegas y sus dos lecturas, de generar-ilustraciones.mjs)
// con los globos apareciendo escalonados y vaivén suave.
import { C, firmaMarca, fondo, globo, persona, solido, trazo, seno, on } from '../lib.mjs'
import { titulo } from '../titulo.mjs'

export const id = 'supervisiones'
export const copia = {
  kicker: 'Supervisión',
  lineas: ['Un espacio para pensar', 'tu práctica con otro'],
  variante: 'marca',
}

function viñeta(tl, L) {
  const wide = L.W > L.H
  const bobA = 3 * Math.sin((2 * Math.PI * tl) / 3.2)
  const bobB = 3 * Math.sin((2 * Math.PI * tl) / 3.2 + 1.2)
  const papel = -4 + 2 * Math.sin((2 * Math.PI * tl) / 4.1)

  let escena
  if (wide) {
    const uA = on(tl, 0.4, 0.5)
    const uB = on(tl, 0.8, 0.5)
    escena = `
    <g transform="translate(0 ${((1 - uA) * 16).toFixed(1)})" opacity="${uA.toFixed(3)}">
      ${globo(250, 240, 660, 210, { colaX: 560, color: C.marca, opacidad: 0.28 })}
    </g>
    <g transform="translate(0 ${((1 - uB) * 16).toFixed(1)})" opacity="${uB.toFixed(3)}">
      ${globo(1010, 330, 660, 210, { colaX: 1360, color: C.sage, opacidad: 0.4 })}
    </g>
    <g transform="translate(0 ${bobA.toFixed(1)})">${persona(560, 620, { s: 1.6 })}</g>
    <g transform="translate(0 ${bobB.toFixed(1)})">${persona(1360, 620, { s: 1.6, color: C.sage })}</g>
    <rect x="430" y="830" width="1060" height="34" rx="17" ${solido(C.palido)}/>
    <line x1="560" y1="864" x2="560" y2="940" ${trazo(10)}/>
    <line x1="1360" y1="864" x2="1360" y2="940" ${trazo(10)}/>
    <g transform="rotate(${papel.toFixed(1)} 960 910)">
      <rect x="896" y="884" width="128" height="52" rx="8" ${solido(C.crema, 9)}/>
      <line x1="918" y1="910" x2="1002" y2="910" stroke="${C.tintaSuave}" stroke-width="8" stroke-linecap="round"/>
    </g>
    ${firmaMarca(1560, 770, 70)}`
  } else {
    const uA = on(tl, 0.4, 0.5)
    const uB = on(tl, 0.8, 0.5)
    escena = `
    <g transform="translate(0 ${((1 - uA) * 16).toFixed(1)})" opacity="${uA.toFixed(3)}">
      ${globo(60, 560, 470, 170, { colaX: 290, color: C.marca, opacidad: 0.28 })}
    </g>
    <g transform="translate(0 ${((1 - uB) * 16).toFixed(1)})" opacity="${uB.toFixed(3)}">
      ${globo(550, 700, 470, 170, { colaX: 790, color: C.sage, opacidad: 0.4 })}
    </g>
    <g transform="translate(0 ${bobA.toFixed(1)})">${persona(320, 950, { s: 1.15 })}</g>
    <g transform="translate(0 ${bobB.toFixed(1)})">${persona(760, 950, { s: 1.15, color: C.sage })}</g>
    <rect x="180" y="1110" width="720" height="30" rx="15" ${solido(C.palido)}/>
    <line x1="320" y1="1140" x2="320" y2="1200" ${trazo(10)}/>
    <line x1="760" y1="1140" x2="760" y2="1200" ${trazo(10)}/>
    <g transform="rotate(${papel.toFixed(1)} 540 1225)">
      <rect x="482" y="1200" width="116" height="50" rx="8" ${solido(C.crema, 9)}/>
      <line x1="502" y1="1225" x2="578" y2="1225" stroke="${C.tintaSuave}" stroke-width="8" stroke-linecap="round"/>
    </g>
    ${firmaMarca(830, 1400, 60)}`
  }

  return `
  ${fondo(L, 'marca')}
  ${escena}`
}

export const escenas = [
  { dur: 2.4, render: (tl, L) => titulo(tl, L, copia) },
  { dur: 8.8, render: viñeta },
]
