// Escena de título genérica de los videos de features: isotipo arriba, kicker
// en marca/uppercase (como el hero de cada página) y título en Poppins.
// Entradas escalonadas, misma gramática que el cierre del video asincrónico.
import { fondo, isotipo, txt, on } from './lib.mjs'

// lineas: array de 1 o 2 strings con el título ya partido.
export function titulo(tl, L, { kicker, lineas, variante = 'marca' }) {
  const wide = L.W > L.H
  const P = wide
    ? { marca: { cx: L.W / 2, cy: 300, w: 210 }, kicker: { y: 500, size: 30 }, titulo: { y: 585, size: 76 }, inter: 88 }
    : { marca: { cx: L.W / 2, cy: 660, w: 200 }, kicker: { y: 845, size: 28 }, titulo: { y: 930, size: 64 }, inter: 78 }

  const uMarca = on(tl, 0.1, 0.6)
  const uKicker = on(tl, 0.3, 0.6)
  const uTit = lineas.map((_, i) => on(tl, 0.5 + i * 0.18, 0.6))
  const cx = P.marca.cx

  return `
  ${fondo(L, variante, { circulo: false, lavado: 0.35 })}
  <g transform="translate(0 ${((1 - uMarca) * 14).toFixed(1)})" opacity="${uMarca.toFixed(3)}">
    ${isotipo(P.marca.cx, P.marca.cy, P.marca.w)}
  </g>
  <g transform="translate(0 ${((1 - uKicker) * 16).toFixed(1)})" opacity="${uKicker.toFixed(3)}">
    ${txt(cx, P.kicker.y, kicker.toUpperCase(), { size: P.kicker.size, weight: 600, fill: '#4E6478', spacing: 6 })}
  </g>
  ${lineas.map((linea, i) => `
  <g transform="translate(0 ${((1 - uTit[i]) * 20).toFixed(1)})" opacity="${uTit[i].toFixed(3)}">
    ${txt(cx, P.titulo.y + i * P.inter, linea, { size: P.titulo.size, weight: 600 })}
  </g>`).join('')}`
}
