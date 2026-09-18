// Línea de tiempo del video. Lee audio/duraciones.json (medido de los mp3 de
// edge-tts) y audio/boundaries.json (offsets de "videos/lecturas/ejercicios"
// dentro de la escena 2), y reparte aire alrededor de cada voz.
//
//   node src/timeline.mjs          → imprime el resumen
//   node src/timeline.mjs --write  → además escribe audio/timeline.json
import { readFileSync, writeFileSync } from 'node:fs'

export function armarTimeline() {
  const durs = JSON.parse(readFileSync('audio/duraciones.json', 'utf8'))
  const boundaries = JSON.parse(readFileSync('audio/boundaries.json', 'utf8'))

  // Silencio antes de que arranque la voz y aire después de que termina.
  // La escena 5 estira la cola a propósito: el cierre de marca se queda quieto.
  const leadIn = { 1: 0.65, 2: 0.35, 3: 0.35, 4: 0.35, 5: 0.45 }
  const tail = { 1: 0.6, 2: 0.6, 3: 0.6, 4: 0.6, 5: 1.9 }

  const escenas = []
  let t = 0
  for (let i = 1; i <= 5; i++) {
    const voz = durs[String(i)]
    const dur = leadIn[i] + voz + tail[i]
    escenas.push({ i, start: round(t), dur: round(dur), vozStart: round(t + leadIn[i]) })
    t += dur
  }
  return { escenas, total: round(t), boundaries }
}

const round = (v) => Math.round(v * 1000) / 1000

if (process.argv[1] && process.argv[1].endsWith('timeline.mjs')) {
  const tl = armarTimeline()
  for (const e of tl.escenas) {
    console.log(
      `escena ${e.i}: ${e.start.toFixed(2)}s → ${(e.start + e.dur).toFixed(2)}s ` +
        `(dur ${e.dur.toFixed(2)}s, voz en ${e.vozStart.toFixed(2)}s)`,
    )
  }
  console.log(`total: ${tl.total.toFixed(2)}s`)
  console.log('boundaries escena 2:', tl.boundaries)
  if (process.argv.includes('--write')) {
    writeFileSync('audio/timeline.json', JSON.stringify(tl, null, 2) + '\n')
    console.log('audio/timeline.json escrito')
  }
}
