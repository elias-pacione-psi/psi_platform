const path = require('path')
const fs = require('fs')
const { generarPdfLeccion } = require('./render')
const { lecciones } = require('./content')

const CURSO_TITULO = 'Psicología Aplicada a la Tarea Pastoral'
const OUT_DIR = path.join(__dirname, 'out', 'lecciones')

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

async function run() {
  console.log(`Iniciando generación de ${lecciones.length} lecciones PDF con branding...`)
  const generados = []

  for (const leccion of lecciones) {
    const filename = `leccion-${leccion.numero}-${leccion.slug}.pdf`
    const outPath = path.join(OUT_DIR, filename)
    process.stdout.write(`Renderizando ${filename}... `)
    
    await generarPdfLeccion(leccion, CURSO_TITULO, outPath)
    
    const stats = fs.statSync(outPath)
    const kb = (stats.size / 1024).toFixed(1)
    console.log(`OK (${kb} KB)`)
    generados.push({
      moduloNumero: leccion.moduloNumero,
      temaNumero: leccion.temaNumero,
      titulo: leccion.titulo,
      filename,
      sizeKb: kb
    })
  }

  console.log(`
Generación completa: ${generados.length} archivos en ${OUT_DIR}`)
}

run().catch((err) => {
  console.error('Error generando lecciones:', err)
  process.exit(1)
})
