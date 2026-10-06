// Video "Terapia individual" (mudo): título con el copy del hero de la página +
// la viñeta encuentro (los dos sillones enfrentados, la taza con vapor y la
// planta, de generar-ilustraciones.mjs). Lo único que se mueve: el vapor.
import { C, firmaMarca, fondo, planta, sillon, solido, taza, trazo, seno } from '../lib.mjs'
import { titulo } from '../titulo.mjs'

export const id = 'terapia-individual'
export const copia = {
  kicker: 'Terapia individual',
  lineas: ['Un espacio propio', 'para tu proceso'],
  variante: 'marca',
}

function viñeta(tl, L) {
  const wide = L.W > L.H
  const pulso = 0.09 + 0.02 * seno(tl, 5)

  let escena
  if (wide) {
    escena = `
    <circle cx="960" cy="560" r="300" fill="${C.marca}" opacity="${pulso.toFixed(3)}"/>
    <circle cx="960" cy="560" r="210" fill="${C.marca}" opacity="0.08"/>
    ${sillon(560, 640, { s: 1.05 })}
    ${sillon(1360, 640, { s: 1.05, espejado: true, relleno: C.palido })}
    <ellipse cx="960" cy="752" rx="86" ry="30" ${solido(C.crema)}/>
    <line x1="960" y1="776" x2="960" y2="818" ${trazo(10)}/>
    <line x1="916" y1="818" x2="1004" y2="818" ${trazo(10)}/>
    ${taza(960, 688, 0.72, tl / 2.2)}
    ${planta(320, 830, 1.05)}
    ${firmaMarca(1620, 800, 70)}`
  } else {
    escena = `
    <circle cx="540" cy="830" r="270" fill="${C.marca}" opacity="${pulso.toFixed(3)}"/>
    <circle cx="540" cy="830" r="190" fill="${C.marca}" opacity="0.08"/>
    ${sillon(330, 920, { s: 0.9 })}
    ${sillon(750, 920, { s: 0.9, espejado: true, relleno: C.palido })}
    <ellipse cx="540" cy="1022" rx="78" ry="28" ${solido(C.crema)}/>
    <line x1="540" y1="1044" x2="540" y2="1084" ${trazo(10)}/>
    <line x1="500" y1="1084" x2="580" y2="1084" ${trazo(10)}/>
    ${taza(540, 958, 0.65, tl / 2.2)}
    ${planta(850, 1150, 0.85)}
    ${firmaMarca(140, 1260, 60)}`
  }

  return `
  ${fondo(L, 'marca')}
  ${escena}`
}

export const escenas = [
  { dur: 2.4, render: (tl, L) => titulo(tl, L, copia) },
  { dur: 8.8, render: viñeta },
]
