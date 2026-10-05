// Renderiza los frames del video a PNG con resvg (SVG → raster nativo, sin
// navegador). Uso:
//   node src/render.mjs --aspect=wide            → frames/   (1920×1080)
//   node src/render.mjs --aspect=tall            → frames9/  (1080×1920)
//   node src/render.mjs --probe=2.5,9.8,17,...   → frames sueltos en out/
//     (los tiempos de --probe son GLOBALES, en segundos sobre la línea total)
import { mkdirSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { armarTimeline } from './timeline.mjs'
import { C, ease, seg } from './lib.mjs'
import escena1 from './escenas/escena1.mjs'
import escena2 from './escenas/escena2.mjs'
import escena3 from './escenas/escena3.mjs'
import escena4 from './escenas/escena4.mjs'
import escena5 from './escenas/escena5.mjs'

const RENDER = { 1: escena1, 2: escena2, 3: escena3, 4: escena4, 5: escena5 }
const XFADE = 0.55 // crossfade entre escenas, en segundos

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)

const aspect = args.aspect === 'tall' ? 'tall' : 'wide'
const W = aspect === 'tall' ? 1080 : 1920
const H = aspect === 'tall' ? 1920 : 1080
const FPS = Number(args.fps ?? 30)

const tl = armarTimeline()
const durs = Object.fromEntries(tl.escenas.map((e) => [e.i, e.dur]))
const leadIn2 = tl.escenas[1].vozStart - tl.escenas[1].start
const ctx = {
  chips: [tl.boundaries.videos, tl.boundaries.lecturas, tl.boundaries.ejercicios].map(
    (v) => v + leadIn2,
  ),
}
const L = { W, H, durs }

const FUENTES = [
  'Poppins-400.ttf', 'Poppins-500.ttf', 'Poppins-600.ttf', 'Poppins-700.ttf',
  'Lora-400-Italic.ttf', 'Lora-500-Italic.ttf',
].map((f) => `assets/fonts/${f}`)

function frameSvg(t) {
  // escena vigente: la última cuyo start <= t
  let i = tl.escenas.length - 1
  while (i > 0 && tl.escenas[i].start > t) i--
  const e = tl.escenas[i]
  const local = Math.min(t - e.start, e.dur - 1 / FPS)

  let inner = ''
  const enTransicion = i > 0 && t < e.start + XFADE
  if (enTransicion) {
    const prev = tl.escenas[i - 1]
    inner += RENDER[prev.i](Math.min(t - prev.start, prev.dur - 1 / FPS), L, ctx)
  }
  const actual = RENDER[e.i](Math.max(local, 0), L, ctx)
  if (enTransicion) {
    const k = ease.inout(seg(t, e.start, e.start + XFADE))
    inner += `<g opacity="${k.toFixed(3)}">${actual}</g>`
  } else {
    inner += actual
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${inner}</svg>`
}

function rasterizar(svg) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    background: C.crema,
    font: { fontFiles: FUENTES, loadSystemFonts: false, defaultFontFamily: 'Poppins' },
  })
  return r.render().asPng()
}

if (args.probe) {
  mkdirSync('out', { recursive: true })
  for (const t of String(args.probe).split(',').map(Number)) {
    const png = rasterizar(frameSvg(t))
    const nombre = `out/probe-${aspect}-${String(t).replace('.', '_')}s.png`
    writeFileSync(nombre, png)
    console.log(`${nombre}`)
  }
} else {
  const dir = aspect === 'tall' ? 'frames9' : 'frames'
  mkdirSync(dir, { recursive: true })
  const totalFrames = Math.round(tl.total * FPS)
  const t0 = Date.now()
  for (let n = 0; n < totalFrames; n++) {
    const t = n / FPS
    writeFileSync(`${dir}/f_${String(n + 1).padStart(6, '0')}.png`, rasterizar(frameSvg(t)))
    if (n % 30 === 0 || n === totalFrames - 1) {
      const eta = (((Date.now() - t0) / (n + 1)) * (totalFrames - n - 1) / 1000).toFixed(0)
      process.stdout.write(`\r${aspect} ${n + 1}/${totalFrames}  eta ${eta}s   `)
    }
  }
  console.log(`\nlisto: ${totalFrames} frames en ${dir}/ (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}
