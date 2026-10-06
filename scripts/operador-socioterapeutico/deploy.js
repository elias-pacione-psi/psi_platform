// Alta del programa "Operador Socioterapéutico" en la plataforma: sube las presentaciones a R2 y
// crea (o actualiza) el programa, sus módulos y sus lecciones en la base.
//
//   node deploy.js              → sube a R2 y crea/actualiza programa, módulos y lecciones
//   node deploy.js --solo-db    → solo la base (los archivos ya están en R2)
//   node deploy.js --dry-run    → muestra qué haría, sin tocar nada
//
// Requiere haber corrido antes `node generar.js` (necesita out/pdf y out/pptx) y las variables
// de .env.local (R2_* y SUPABASE_SERVICE_ROLE_KEY). Es idempotente: los ids son fijos, así que
// volver a correrlo actualiza lo que ya está en vez de duplicarlo. Mismo patrón que
// scripts/curso-pastoral/deploy.js (la formación pastoral).
//
// Un capítulo del libro = un módulo; su contenido = UNA lección (la presentación en PDF, que es lo
// que muestra el visor de lecciones). El .pptx editable —con las notas del orador— se sube aparte,
// a otra carpeta del bucket, para que el psicólogo pueda presentar offline desde PowerPoint.
//
// El programa se crea OCULTO (publicado_en_home = false), como todo programa nuevo (opt-in desde el
// panel). Si ya existe, no se toca esa marca ni la portada: las maneja el panel y
// docs/portadas/generar-portadas-programas.mjs.
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local'), quiet: true })
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { createClient } = require('@supabase/supabase-js')
const capitulos = require('./contenido')

const dryRun = process.argv.includes('--dry-run')
const soloDb = process.argv.includes('--solo-db')

const PROGRAMA_ID = '33333333-3333-3333-3333-333333333333'
const PROGRAMA = {
  titulo: 'Operador Socioterapéutico',
  descripcion: 'Programa de formación para acompañar procesos de recuperación en adicciones: un recorrido clínico, familiar, social y espiritual, con fundamento y sin prejuicio.',
  descripcion_larga: [
    'Un recorrido clínico, familiar, social y espiritual para acompañar procesos de recuperación con fundamento y sin prejuicio.',
    '8 módulos semanales · 3 horas cátedra por módulo · 2 meses de cursada.',
    'Para profesionales de la salud mental, el trabajo social o la medicina que quieren especializarse en el abordaje de las adicciones, y para quienes se forman por primera vez como operadores socioterapéuticos: líderes comunitarios, pastores, familiares y voluntarios de instituciones.',
    'Combina tres fuentes que no siempre se integran: la experiencia directa de trabajo en un centro de recuperación, el conocimiento clínico validado por la investigación en psicología de las adicciones y una mirada humana y espiritual.',
    'Cada módulo trabaja una herramienta práctica en hoja suelta: del cerebro a la comunidad, del mapa de prejuicios al plan de tratamiento integral.',
  ].join('\n\n'),
  tipo: 'formacion', // la UI lo llama "Material de formación"
}
const R2_PREFIX = 'Formaciones/Operador Socioterapeutico/'
const CARPETA_PDF = `${R2_PREFIX}diapositivas/`
const CARPETA_PPTX = `${R2_PREFIX}diapositivas editables/`
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

// ids fijos y legibles: a3333333-…-0000000000NN (módulo NN) / b3333333-…-0000000000NN (su lección)
const idModulo = (n) => `a3333333-3333-3333-3333-${String(n).padStart(12, '0')}`
const idLeccion = (n) => `b3333333-3333-3333-3333-${String(n).padStart(12, '0')}`

function s3() {
  const faltan = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'].filter((v) => !process.env[v])
  if (faltan.length) throw new Error(`Faltan variables en .env.local: ${faltan.join(', ')}`)
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  })
}

async function subir(cliente, Key, ruta, ContentType) {
  const cuerpo = fs.readFileSync(ruta)
  if (dryRun) return console.log(`  (simulación) ↑ ${Key}  (${(cuerpo.length / 1024).toFixed(0)} KB)`)
  await cliente.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key, Body: cuerpo, ContentType }))
  // se verifica por la API de R2 y no por el mount de rclone (que sube en segundo plano)
  const h = await cliente.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key }))
  if (h.ContentLength !== cuerpo.length) throw new Error(`R2 guardó ${h.ContentLength} bytes de ${cuerpo.length} en ${Key}`)
  console.log(`  ↑ ${Key}  (${(cuerpo.length / 1024).toFixed(0)} KB)`)
}

async function archivos() {
  console.log('— 1. Archivos en R2 —')
  const faltan = capitulos.flatMap((c) => [`out/pdf/${c.archivo}.pdf`, `out/pptx/${c.archivo}.pptx`]).filter((f) => !fs.existsSync(path.join(__dirname, f)))
  if (faltan.length) throw new Error(`Faltan archivos generados (corré primero "node generar.js"):\n  ${faltan.join('\n  ')}`)
  const cliente = dryRun ? null : s3()
  for (const c of capitulos) {
    await subir(cliente, `${CARPETA_PDF}${c.archivo}.pdf`, path.join(__dirname, 'out/pdf', `${c.archivo}.pdf`), 'application/pdf')
    await subir(cliente, `${CARPETA_PPTX}${c.archivo}.pptx`, path.join(__dirname, 'out/pptx', `${c.archivo}.pptx`), PPTX_MIME)
  }
}

async function base() {
  console.log('— 2. Programa, módulos y lecciones en la base —')
  const db = dryRun ? null : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const ok = (r, donde) => { if (r.error) throw new Error(`${donde}: ${r.error.message}`) }

  // programa: si ya existe, no se pisan publicado_en_home ni portada_key
  if (dryRun) console.log(`  (simulación) programa ${PROGRAMA_ID} "${PROGRAMA.titulo}" [${PROGRAMA.tipo}]`)
  else {
    const { data: existente } = await db.from('programas').select('id').eq('id', PROGRAMA_ID).maybeSingle()
    if (existente) { ok(await db.from('programas').update(PROGRAMA).eq('id', PROGRAMA_ID), 'programas.update'); console.log(`  = programa actualizado: ${PROGRAMA.titulo}`) }
    else { ok(await db.from('programas').insert({ id: PROGRAMA_ID, ...PROGRAMA, publicado_en_home: false }), 'programas.insert'); console.log(`  + programa creado (oculto): ${PROGRAMA.titulo}`) }
  }

  for (const c of capitulos) {
    const modulo = { id: idModulo(c.orden), programa_id: PROGRAMA_ID, titulo: c.moduloTitulo, descripcion: c.moduloDescripcion, orden: c.orden }
    const leccion = {
      id: idLeccion(c.orden), programa_id: PROGRAMA_ID, modulo_id: idModulo(c.orden), titulo: c.leccionTitulo,
      // 'drive_pdf' es el nombre histórico del tipo "PDF" (también para los de R2): igual que la formación pastoral
      tipo_contenido: 'drive_pdf', url_recurso: `r2key://${CARPETA_PDF}${c.archivo}.pdf`, orden: 0, tipo_medio: 'pdf', origen: 'r2',
    }
    if (dryRun) { console.log(`  (simulación) módulo ${c.orden}: ${c.moduloTitulo}  →  ${leccion.url_recurso}`); continue }
    ok(await db.from('modulos').upsert(modulo), `modulos ${c.orden}`)
    ok(await db.from('lecciones').upsert(leccion), `lecciones ${c.orden}`)
    console.log(`  ✓ módulo ${String(c.orden).padStart(2)}: ${c.moduloTitulo}`)
  }
}

async function main() {
  if (!soloDb) await archivos()
  await base()
  console.log(dryRun ? '\n(simulación: no se tocó nada)' : '\nListo. El programa quedó oculto: se publica desde el panel (Programas → "Publicar en Home").')
}
main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
