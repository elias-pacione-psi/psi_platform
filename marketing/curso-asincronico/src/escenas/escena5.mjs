// ESCENA 5 (0:33–0:40) — "Elegí tu curso, escribinos, y arrancá cuando estés
// listo vos." Cierre de marca: isotipo (el PNG real de public/brand), nombre
// en Poppins semibold, claim en Lora itálica y botón píldora con pulso suave.
import { C, fondo, txt, isotipo, seno, seg, ease, on } from '../lib.mjs'

export default function escena5(tl, L) {
  const wide = L.W > L.H
  const P = wide
    ? { marca: { cx: 960, cy: 392, w: 330 }, nombre: { y: 668, size: 74 }, claim: { y: 738, size: 40 }, boton: { cx: 960, cy: 884, w: 512, h: 100 } }
    : { marca: { cx: 540, cy: 716, w: 300 }, nombre: { y: 1006, size: 66 }, claim: { y: 1076, size: 38 }, boton: { cx: 540, cy: 1256, w: 500, h: 100 } }

  const uMarca = on(tl, 0.1, 0.7)
  const uNombre = on(tl, 0.35, 0.7)
  const uClaim = on(tl, 0.6, 0.7)
  const uBoton = ease.back(seg(tl, 0.95, 1.55))
  // pulso respirando una vez que el botón ya está en escena
  const pulso = tl > 1.7 ? 1 + 0.018 * seno(tl - 1.7, 2.6) : 1
  const escBoton = Math.max(uBoton, 0.001) * pulso

  const { cx: bx, cy: by, w: bw, h: bh } = P.boton

  return `
  ${fondo(L, 'marca', { circulo: false, lavado: 0.45 })}
  <g transform="translate(0 ${((1 - uMarca) * 14).toFixed(1)})" opacity="${uMarca.toFixed(3)}">
    ${isotipo(P.marca.cx, P.marca.cy, P.marca.w)}
  </g>
  <g transform="translate(0 ${((1 - uNombre) * 18).toFixed(1)})" opacity="${uNombre.toFixed(3)}">
    ${txt(P.marca.cx, P.nombre.y, 'Elias Pacione', { size: P.nombre.size, weight: 600 })}
  </g>
  <g transform="translate(0 ${((1 - uClaim) * 18).toFixed(1)})" opacity="${(uClaim * 0.82).toFixed(3)}">
    ${txt(P.marca.cx, P.claim.y, 'Psicología con sentido.', { size: P.claim.size, weight: 500, family: 'Lora', italic: true })}
  </g>
  <g transform="translate(${bx} ${by}) scale(${escBoton.toFixed(4)}) translate(${-bx} ${-by})" opacity="${Math.min(1, uBoton).toFixed(3)}">
    <rect x="${bx - bw / 2}" y="${by - bh / 2 + 10}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${C.tinta}" opacity="0.10"/>
    <rect x="${bx - bw / 2}" y="${by - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${C.marca}"/>
    ${txt(bx, by + 12, 'Quiero más información', { size: 34, weight: 600, fill: C.hueso })}
  </g>`
}
