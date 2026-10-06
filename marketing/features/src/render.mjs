// Renderiza los frames de un video de feature a PNG (solo imagen, sin audio).
//   node src/render.mjs --video=supervisiones --aspect=wide   → frames-supervisiones/
//   node src/render.mjs --video=terapia-individual --aspect=tall → frames9-terapia-individual/
//   node src/render.mjs --video=fe --probe=1,7               → frames sueltos en out/
import { mkdirSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'
import { C, ease, seg } from './lib.mjs'
import * as supervisiones from './videos/supervisiones.mjs'
import * as terapia from './videos/terapia-individual.mjs'
import * as fe from './videos/psicologia-y-fe.mjs'

const VIDEOS = { supervisiones, terapia, fe }
const XFADE = 0.55

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  }),
)

const clave =
  args.video === 'terapia-individual' || args.video === 'terapia' ? 'terapia'
  : args.video === 'fe' || args.video === 'psicologia-y-fe' ? 'fe'
  : 'supervisiones'
const video = VIDEOS[clave]
const vid = clave === 'terapia' ? 'terapia-individual' : clave === 'fe' ? 'psicologia-y-fe' : 'supervisiones'

const aspect = args.aspect === 'tall' ? 'tall' : 'wide'
const W = aspect === 'tall' ? 1080 : 1920
const H = aspect === 'tall' ? 1920 : 1080
const FPS = Number(args.fps ?? 30)

const escenas = video.escenas
const total = escenas.reduce((a, e) => a + e.dur, 0)
const L = { W, H }

const FUENTES = [
  'Poppins-400.ttf', 'Poppins-500.ttf', 'Poppins-600.ttf', 'Poppins-700.ttf',
  'Lora-400-Italic.ttf', 'Lora-500-Italic.ttf',
].map((f) => `../curso-asincronico/assets/fonts/${f}`)

function escenaEn(t) {
  let i = escenas.length - 1
  let acc = 0
  const starts = escenas.map((e) => {
    const s = acc
    acc += e.dur
    return s
  })
  while (i > 0 && starts[i] > t) i--
  return { i, start: starts[i] }
}

function frameSvg(t) {
  const { i, start } = escenaEn(t)
  const e = escenas[i]
  const local = Math.min(t - start, e.dur - 1 / FPS)

  let inner = ''
  const enTransicion = i > 0 && t < start + XFADE
  if (enTransicion) {
    // la escena anterior queda quieta en su último instante durante el fundido
    const prev = escenas[i - 1]
    inner = prev.render(Math.max(prev.dur - 1 / FPS, 0), L)
  }
  const actual = e.render(Math.max(local, 0), L)
  if (enTransicion) {
    const k = ease.inout(seg(t, start, start + XFADE))
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
    const nombre = `out/probe-${vid}-${aspect}-${String(t).replace('.', '_')}s.png`
    writeFileSync(nombre, rasterizar(frameSvg(t)))
    console.log(nombre)
  }
} else {
  const dir = `${aspect === 'tall' ? 'frames9' : 'frames'}-${vid}`
  mkdirSync(dir, { recursive: true })
  const totalFrames = Math.round(total * FPS)
  const t0 = Date.now()
  for (let n = 0; n < totalFrames; n++) {
    writeFileSync(`${dir}/f_${String(n + 1).padStart(6, '0')}.png`, rasterizar(frameSvg(n / FPS)))
    if (n % 30 === 0 || n === totalFrames - 1) {
      const eta = (((Date.now() - t0) / (n + 1)) * (totalFrames - n - 1) / 1000).toFixed(0)
      process.stdout.write(`\r${vid} ${aspect} ${n + 1}/${totalFrames}  eta ${eta}s   `)
    }
  }
  console.log(`\nlisto: ${totalFrames} frames en ${dir}/ (${((Date.now() - t0) / 1000).toFixed(0)}s)`)
}
