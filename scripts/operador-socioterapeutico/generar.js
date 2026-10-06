// Genera las presentaciones del programa "Operador Socioterapéutico":
//   node generar.js                 → todas (PPTX + PDF) en out/
//   node generar.js --solo=3        → un solo capítulo (por número de orden, 0..10)
//   node generar.js --sin-pdf       → solo el .pptx (más rápido para iterar el diseño)
//   node generar.js --contenido=ruta/a/otro.js   → usa otro conjunto de capítulos (pruebas)
//
// Necesita LibreOffice (`soffice`) para convertir cada .pptx a PDF: el PDF es lo que se cargó como
// lección en la plataforma (el visor de lecciones muestra PDFs); el .pptx se guarda aparte para
// que el psicólogo pueda presentar y editar en PowerPoint/Keynote, con las notas del orador.
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { Deck, agregar } = require('./lib/slides')

const arg = (nombre) => process.argv.find((a) => a.startsWith(`--${nombre}=`))?.split('=').slice(1).join('=')
const OUT = path.join(__dirname, 'out')
const contenidoPath = arg('contenido') ?? './contenido'
const capitulos = require(path.resolve(__dirname, contenidoPath))
const solo = arg('solo')
const sinPdf = process.argv.includes('--sin-pdf')

const seleccion = capitulos.filter((c) => solo === undefined || String(c.orden) === solo)
if (!seleccion.length) throw new Error(`--solo=${solo}: no hay un capítulo con ese orden (0..${capitulos.length - 1})`)

fs.mkdirSync(path.join(OUT, 'pptx'), { recursive: true })
fs.mkdirSync(path.join(OUT, 'pdf'), { recursive: true })

async function main() {
  const advertencias = []
  const chicas = []
  for (const cap of seleccion) {
    const d = Deck({ curso: 'Operador Socioterapéutico', etiqueta: cap.etiqueta, total: cap.slides.length, advertencias })
    for (const s of cap.slides) agregar(d, s)
    for (const [n, pt] of Object.entries(d.minPt)) if (pt < 14) chicas.push(`[${cap.archivo.slice(0, 2)} · diapo ${n}/${cap.slides.length} · ${d.tipos[n]}] cuerpo mínimo ${pt.toFixed(1)} pt`)
    const base = cap.archivo
    const pptx = path.join(OUT, 'pptx', `${base}.pptx`)
    await d.pres.writeFile({ fileName: pptx })
    let msg = `✓ ${base}.pptx (${cap.slides.length} diapositivas)`
    if (!sinPdf) {
      // perfil propio de LibreOffice: evita pelearse con otra instancia abierta del usuario
      execFileSync('soffice', ['--headless', '-env:UserInstallation=file:///tmp/lo-operador', '--convert-to', 'pdf', '--outdir', path.join(OUT, 'pdf'), pptx], { stdio: 'ignore' })
      msg += ' + PDF'
    }
    console.log(msg)
  }
  if (chicas.length) {
    console.log(`\nLegibilidad: ${chicas.length} diapositiva(s) con letra menor a 14 pt (conviene acortar el texto):`)
    chicas.forEach((a) => console.log('  ' + a))
  }
  if (advertencias.length) {
    console.log(`\n⚠ ${advertencias.length} texto(s) que no entran en su caja — acortar o agrandar la caja:`)
    advertencias.forEach((a) => console.log('  ' + a))
  } else {
    console.log('\nSin advertencias: todo el texto entra en su caja.')
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
