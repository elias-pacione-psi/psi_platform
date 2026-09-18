// Mezcla el audio final: concatena las voces con los delays de la línea de
// tiempo, las normaliza, genera la música si falta y la pone por debajo.
// Escribe audio/voz.wav y audio/audio-final.wav.
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync, execSync } from 'node:child_process'
import { armarTimeline } from './timeline.mjs'

const tl = armarTimeline()

// --- música (se regenera solo si no existe o quedó corta)
let generarMusica = true
if (existsSync('audio/musica.wav')) {
  const d = Number(
    execSync(
      'ffprobe -v error -show_entries format=duration -of csv=p=0 audio/musica.wav',
    ).toString(),
  )
  generarMusica = d < tl.total + 0.4
}
if (generarMusica) {
  execFileSync('./venv/bin/python', ['gen_musica.py', String(tl.total + 0.5)], {
    stdio: 'inherit',
  })
}

// --- voz completa: un mp3 por escena con su delay + normalización suave
const inputs = tl.escenas.flatMap((e) => ['-i', `audio/voz/escena${e.i}.mp3`])
const delays = tl.escenas
  .map((e, k) => `[${k}:a]aresample=44100,adelay=${Math.round(e.vozStart * 1000)}|${Math.round(e.vozStart * 1000)}[a${k}]`)
  .join(';')
const mezcla = `${delays};${tl.escenas.map((_, k) => `[a${k}]`).join('')}amix=inputs=5:normalize=0,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,loudnorm=I=-15:TP=-1.5:LRA=11[v]`
execSync(
  `ffmpeg -y ${inputs.join(' ')} -filter_complex "${mezcla}" -map "[v]" -ar 44100 -ac 2 audio/voz.wav`,
  { stdio: 'inherit' },
)

// --- mezcla final: música al ~16% por debajo de la voz, con fade de entrada
execSync(
  `ffmpeg -y -i audio/voz.wav -i audio/musica.wav -filter_complex "[1:a]volume=0.16,afade=t=in:st=0:d=1.2[m];[0:a][m]amix=inputs=2:normalize=0[a]" -map "[a]" -ar 44100 -ac 2 audio/audio-final.wav`,
  { stdio: 'inherit' },
)

console.log(`audio/voz.wav + audio/audio-final.wav listos (total ${tl.total.toFixed(2)}s)`)
