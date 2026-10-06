// Extrae el libro "Programa de Formación: Operador Socioterapéutico en Adicciones" (PDF) a un
// JSON por secciones (contenido/libro.json): las diapositivas citan de ahí el desarrollo
// completo del autor como NOTAS DEL ORADOR, textual, sin reescribirlo.
//
//   node extraer-libro.js "/ruta/al/libro.pdf"
//
// Requiere `pdftotext` (poppler). El JSON queda versionado: regenerar las presentaciones NO
// necesita el PDF, solo se vuelve a correr esto si el libro cambia.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const pdf = process.argv[2]
if (!pdf) { console.error('Uso: node extraer-libro.js /ruta/al/libro.pdf'); process.exit(1) }
const crudo = execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
const lineas = crudo.split('\n').map((l) => l.replace(/\f/g, '').replace(/\s+$/, '')) // \f = salto de página: pega el encabezado a la primera línea

// Encabezados sin número, con la clave con que se citan desde las diapositivas.
const SIN_NUMERO = {
  'Presentación del programa': 'P0',
  'A quién está dirigido': 'P1',
  'Objetivos generales': 'P2',
  'Metodología': 'P3',
  'Cronograma general': 'P4',
  'Materiales necesarios': 'P5',
  'Encuadre ético del programa': 'E0',
  'Tres acuerdos que sostienen el aula': 'E1',
  'Los límites del rol del operador socioterapéutico': 'E2',
  'Cierre del programa': 'C0',
  'Criterios de finalización sugeridos': 'C1',
  'Bibliografía y fuentes de referencia': 'C2',
  'Índice de herramientas del programa': 'C3',
}

const secciones = {}
let clave = null
let modulo = 0
const empezo = lineas.findIndex((l) => l === 'Presentación del programa' ) // el índice lista "1. Presentación…"
for (let i = empezo; i < lineas.length; i++) {
  const l = lineas[i]
  let m
  if ((m = l.match(/^(\d)\.(\d) · (.+)$/))) { clave = `${m[1]}.${m[2]}`; secciones[clave] = { titulo: m[3], lineas: [] }; continue }
  if (SIN_NUMERO[l] && !secciones[SIN_NUMERO[l]]) { clave = SIN_NUMERO[l]; secciones[clave] = { titulo: l, lineas: [] }; continue }
  if ((m = l.match(/^MÓDULO (\d) DE 8$/))) { modulo = +m[1]; clave = `M${modulo}`; secciones[clave] = { titulo: `Módulo ${modulo}`, lineas: [] }; continue }
  if ((m = l.match(/^HERRAMIENTA (\d) · HOJA IMPRIMIBLE$/))) { clave = `H${m[1]}`; secciones[clave] = { titulo: `Herramienta ${m[1]}`, lineas: [] }; continue }
  if (/^Elias Pacione — Psicología con sentido$/.test(l) || /^Elias Pacione$/.test(l) || /^Psicología con sentido$/.test(l)) continue
  if (clave) secciones[clave].lineas.push(l)
}

// Líneas → párrafos. El PDF corta cada renglón a ~120 caracteres; un renglón corto que cierra
// con punto es el final de un párrafo.
function parrafos(ls) {
  const salida = []
  let buf = []
  let hueco = false // venía una línea en blanco
  const cerrar = () => { if (buf.length) { salida.push(buf.join(' ').replace(/\s+/g, ' ').trim()); buf = [] } }
  for (const l of ls) {
    if (!l.trim()) { hueco = true; continue }
    // Un salto de página parte las oraciones: si lo anterior no terminó en puntuación y esto
    // sigue en minúscula, es la misma oración, no un párrafo nuevo.
    const sigue = /^[a-záéíóúüñ]/.test(l.trim()) && buf.length && !/[.:;»)?!”]$/.test(buf[buf.length - 1])
    if (hueco && !sigue) cerrar()
    hueco = false
    buf.push(l.trim())
    if (l.length < 95 && /[.:»)?!]$/.test(l.trim())) cerrar()
  }
  cerrar()
  // "●" y "☐" vienen solos en su línea: se pegan al párrafo que les sigue como viñeta
  const limpio = []
  let marca = ''
  for (const p of salida.filter(Boolean)) {
    if (p === '●') { marca = '• '; continue }
    if (p === '☐') { marca = '☐ '; continue }
    limpio.push(marca + p)
    marca = ''
  }
  return limpio
}

const salida = {}
for (const [k, v] of Object.entries(secciones)) salida[k] = { titulo: v.titulo, parrafos: parrafos(v.lineas) }
const destino = path.join(__dirname, 'contenido', 'libro.json')
fs.writeFileSync(destino, JSON.stringify(salida, null, 1) + '\n')
console.log(`${Object.keys(salida).length} secciones → ${destino}`)
console.log(Object.keys(salida).join('  '))
