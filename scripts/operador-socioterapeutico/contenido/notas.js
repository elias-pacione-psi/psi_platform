// Notas del orador: el desarrollo completo del libro, textual, por sección (libro.json).
// La diapositiva dice poco; la nota dice todo lo que el autor escribió sobre ese punto.
const libro = require('./libro.json')

function nota(...claves) {
  return claves
    .map((k) => {
      const sec = libro[k]
      if (!sec) throw new Error(`notas.js: no existe la sección "${k}" del libro`)
      const encabezado = /^\d\.\d$/.test(k) ? `${k} · ${sec.titulo}\n\n` : ''
      return encabezado + sec.parrafos.join('\n\n')
    })
    .join('\n\n— — —\n\n')
}

// Primer párrafo de la introducción de un módulo (la bajada que el libro pone bajo el título).
function bajada(n) {
  const sec = libro[`M${n}`]
  if (!sec) throw new Error(`notas.js: no existe la introducción del módulo ${n}`)
  return sec.parrafos[0]
}

module.exports = { nota, bajada, libro }
