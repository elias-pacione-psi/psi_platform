// Video "Psicología y Fe" (mudo): título con el copy del hero de la página + la
// viñeta puente (las dos orillas unidas, de generar-ilustraciones.mjs). Los
// tensores se dibujan uno a uno, el agua alterna fase y la figura respira.
import { C, firmaMarca, fondo, persona, solido, trazo, seno, on, f } from '../lib.mjs'
import { titulo } from '../titulo.mjs'

export const id = 'psicologia-y-fe'
export const copia = {
  kicker: 'Psicología y Fe',
  lineas: ['Psicología aplicada para', 'la comunidad cristiana'],
  variante: 'marca',
}

// Puente paramétrico sobre la parábola (x0,y0) ctrl (xc,yc) (x1,y1).
// `segs` = tramos de onda del agua (6 en apaisado, 5 en vertical).
function puente(tl, o) {
  const { x0, y0, xc, yc, x1, y1, largoTensor, figura, segs } = o
  const pto = (u) => [
    (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * xc + u * u * x1,
    (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * yc + u * u * y1,
  ]
  const tensores = [0.18, 0.36, 0.5, 0.64, 0.82]
    .map((u, i) => {
      const [x, y] = pto(u)
      return `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y + largoTensor)}" stroke="${C.tinta}" stroke-width="8" stroke-linecap="round" opacity="${(0.5 * on(tl, 0.5 + i * 0.18, 0.4)).toFixed(3)}"/>`
    })
    .join('')
  const faseAgua = seno(tl, 3.4)
  const onda = (dy) => {
    const tramos = Array.from({ length: segs }, (_, i) =>
      i === 0 ? 'q 50 -24 100 0' : 't 100 0',
    ).join(' ')
    return `<path d="M ${x0 + 40} ${y0 + dy} ${tramos}" ${trazo(7)} opacity="${(0.5 * faseAgua).toFixed(3)}"/>`
  }
  const [fx] = pto(0.5)
  const bob = 3 * Math.sin((2 * Math.PI * tl) / 3.6)
  return `
  <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="200" fill="${C.marca}" opacity="0.14"/>
  <path d="M ${x0} ${y0} Q ${xc} ${yc} ${x1} ${y1}" ${trazo(12)}/>
  <path d="M ${x0} ${y0 + 28} Q ${xc} ${yc + 28} ${x1} ${y1 + 28}" ${trazo(12)}/>
  ${tensores}
  ${onda(80)}
  ${onda(142)}
  <g transform="translate(0 ${bob.toFixed(1)})">
    ${persona(fx, figura.y, { s: figura.s })}
  </g>`
}

function viñeta(tl, L) {
  const wide = L.W > L.H
  const pulso = 0.5 + 0.5 * Math.sin((2 * Math.PI * tl) / 5)

  let escena
  if (wide) {
    escena = `
    <circle cx="800" cy="300" r="146" fill="${C.marca}" opacity="${(0.22 + 0.04 * pulso).toFixed(3)}"/>
    <circle cx="1120" cy="300" r="146" fill="${C.sage}" opacity="${(0.32 + 0.04 * pulso).toFixed(3)}"/>
    <circle cx="800" cy="300" r="146" ${trazo(8)}/>
    <circle cx="1120" cy="300" r="146" ${trazo(8)}/>
    <rect x="0" y="720" width="620" height="200" fill="${C.palido}"/>
    <rect x="1300" y="720" width="620" height="200" fill="${C.palido}"/>
    <line x1="0" y1="720" x2="620" y2="720" ${trazo(10)}/>
    <line x1="1300" y1="720" x2="1920" y2="720" ${trazo(10)}/>
    ${puente(tl, { x0: 620, y0: 720, xc: 960, yc: 530, x1: 1300, y1: 720, largoTensor: 62, figura: { y: 548, s: 0.62 }, segs: 6 })}
    ${firmaMarca(150, 790, 70)}`
  } else {
    escena = `
    <circle cx="455" cy="430" r="120" fill="${C.marca}" opacity="${(0.22 + 0.04 * pulso).toFixed(3)}"/>
    <circle cx="625" cy="430" r="120" fill="${C.sage}" opacity="${(0.32 + 0.04 * pulso).toFixed(3)}"/>
    <circle cx="455" cy="430" r="120" ${trazo(8)}/>
    <circle cx="625" cy="430" r="120" ${trazo(8)}/>
    <rect x="0" y="990" width="240" height="180" fill="${C.palido}"/>
    <rect x="840" y="990" width="240" height="180" fill="${C.palido}"/>
    <line x1="0" y1="990" x2="240" y2="990" ${trazo(10)}/>
    <line x1="840" y1="990" x2="1080" y2="990" ${trazo(10)}/>
    ${puente(tl, { x0: 240, y0: 990, xc: 540, yc: 840, x1: 840, y1: 990, largoTensor: 56, figura: { y: 838, s: 0.55 }, segs: 5 })}
    ${firmaMarca(830, 1320, 60)}`
  }

  return `
  ${fondo(L, 'marca')}
  ${escena}`
}

export const escenas = [
  { dur: 2.4, render: (tl, L) => titulo(tl, L, copia) },
  { dur: 8.8, render: viñeta },
]
