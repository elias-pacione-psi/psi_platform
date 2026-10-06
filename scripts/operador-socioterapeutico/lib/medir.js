// Medición de texto con las métricas REALES de Poppins y Lora (las mismas fuentes que carga
// el sitio y que usa LibreOffice al convertir el .pptx a PDF), para que ningún texto se
// desborde de su caja. PowerPoint/LibreOffice no achican el texto solos: si la caja queda
// chica, el texto se sale. Acá se calcula antes, con envoltura de palabras exacta.
const fontkit = require('fontkit')
const path = require('path')

const DIR = path.join(__dirname, '../../curso-pastoral/fonts')
const ARCHIVOS = {
  regular: 'Poppins-Regular.ttf',
  negrita: 'Poppins-Bold.ttf',
  serif: 'Lora-Regular.ttf',
  serifCursiva: 'Lora-Italic.ttf',
}
const cache = {}
function fuente(tipo) {
  if (!ARCHIVOS[tipo]) throw new Error(`Fuente desconocida: ${tipo}`)
  return (cache[tipo] ??= fontkit.openSync(path.join(DIR, ARCHIVOS[tipo])))
}

// Alto de línea natural (ascender + descender + lineGap) en em. Poppins es alta: 1,5 em.
const ALTO_LINEA_EM = { regular: 1.5, negrita: 1.5, serif: 1.28, serifCursiva: 1.28 }

// Ancho en pulgadas de un texto de una sola línea.
function ancho(texto, tipo, pt) {
  const f = fuente(tipo)
  const unidades = f.layout(texto).glyphs.reduce((s, g) => s + g.advanceWidth, 0)
  return (unidades / f.unitsPerEm) * pt / 72
}

// Envoltura de palabras: devuelve las líneas que ocupa `texto` en una caja de `anchoIn`.
// Respeta los saltos de línea explícitos (\n). Una palabra más larga que la caja se deja
// en su propia línea (se desbordaría igual en PowerPoint: mejor que lo detecte `ajustar`).
function lineas(texto, tipo, pt, anchoIn) {
  const salida = []
  for (const parrafo of String(texto).split('\n')) {
    const palabras = parrafo.split(/\s+/).filter(Boolean)
    if (!palabras.length) { salida.push(''); continue }
    let actual = ''
    for (const p of palabras) {
      const prueba = actual ? `${actual} ${p}` : p
      if (!actual || ancho(prueba, tipo, pt) <= anchoIn) actual = prueba
      else { salida.push(actual); actual = p }
    }
    salida.push(actual)
  }
  return salida
}

// Alto en pulgadas de `n` líneas a `pt` con el multiplicador de interlineado de PowerPoint.
function alto(n, tipo, pt, mult = 1) {
  return n * pt * ALTO_LINEA_EM[tipo] * mult / 72
}

// Margen de seguridad sobre el ancho: LibreOffice y PowerPoint no rompen exactamente igual
// que fontkit (kerning, espacios), y un renglón que "casi entra" en un lado se parte en el otro.
const SEGURIDAD = 0.93

// Ancho de la palabra más larga: una palabra que no entra en la caja se parte A MITAD DE PALABRA
// al convertir a PDF ("socioterapéut/icos"), así que ese tamaño no sirve aunque la altura alcance.
function palabraMasAncha(texto, tipo, pt) {
  let max = 0
  for (const palabra of String(texto).split(/\s+/)) if (palabra) max = Math.max(max, ancho(palabra, tipo, pt))
  return max
}

// Elige el mayor tamaño (entre max y min) con el que `texto` entra en w × h. Si ni el mínimo
// entra, devuelve ok:false con el mínimo — quien llama decide si acorta el texto.
function ajustar(texto, { tipo = 'regular', w, h, max = 18, min = 11, mult = 0.9, paso = 0.5 }) {
  for (let pt = max; pt >= min - 1e-9; pt -= paso) {
    const ls = lineas(texto, tipo, pt, w * SEGURIDAD)
    const necesario = alto(ls.length, tipo, pt, mult)
    if (necesario <= h && palabraMasAncha(texto, tipo, pt) <= w * SEGURIDAD) return { pt, lineas: ls, alto: necesario, ok: true }
  }
  const ls = lineas(texto, tipo, min, w * SEGURIDAD)
  return { pt: min, lineas: ls, alto: alto(ls.length, tipo, min, mult), ok: false }
}

module.exports = { ancho, lineas, alto, ajustar, palabraMasAncha, ALTO_LINEA_EM, SEGURIDAD }
