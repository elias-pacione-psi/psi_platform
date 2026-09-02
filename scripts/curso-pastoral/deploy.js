require('dotenv').config({ path: '/home/lucas_fedora/Documentos/GitHub/Plataforma_Psicologo/.env.local' })
const fs = require('fs')
const path = require('path')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { createClient } = require('@supabase/supabase-js')
const { lecciones } = require('./content')
const { quizzes } = require('./quizzes')

const PROGRAMA_ID = '22222222-2222-2222-2222-222222222222'
const PROGRAMA_TITULO = 'Psicología Aplicada a la Tarea Pastoral'
const PROGRAMA_DESCRIPCION = 'Formación integral de 8 semanas para la detección temprana, contención inicial y derivación responsable de problemáticas de salud mental en la comunidad de fe. Enfoques: TCC, TREC, ACT y habilidades de comunicación. 4 módulos virtuales + 4 encuentros presenciales.'
const R2_PREFIX = 'Formaciones/Psicologia Aplicada a la Tarea Pastoral/'

const LOCAL_MIRROR_DIR = '/home/lucas_fedora/R2_Bucket_Psicologo/Formaciones/Psicologia Aplicada a la Tarea Pastoral'
const OUT_DIR = path.join(__dirname, 'out')

function r2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

function supabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function subirArchivosR2() {
  const s3 = r2Client()
  console.log('--- 1. Subiendo archivos a Cloudflare R2 y sincronizando espejo local ---')
  
  // Asegurar espejo local
  fs.mkdirSync(path.join(LOCAL_MIRROR_DIR, 'lecciones'), { recursive: true })
  fs.mkdirSync(path.join(LOCAL_MIRROR_DIR, 'infografias'), { recursive: true })
  fs.mkdirSync(path.join(LOCAL_MIRROR_DIR, 'presentacion'), { recursive: true })

  const mapClaves = {
    lecciones: {},
    infografias: {},
    presentacion: null
  }

  // A) Presentación
  {
    const presFile = 'presentacion-resumen-ejecutivo.pdf'
    const localPath = path.join(OUT_DIR, 'presentacion', presFile)
    const key = `${R2_PREFIX}presentacion/${presFile}`
    const body = fs.readFileSync(localPath)

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'application/pdf',
    }))
    fs.copyFileSync(localPath, path.join(LOCAL_MIRROR_DIR, 'presentacion', presFile))
    console.log(`R2 OK -> ${key} (${(body.length / 1024).toFixed(1)} KB)`)
    mapClaves.presentacion = key
  }

  // B) Infografías
  const infografiasFiles = [
    { id: 'pap', file: 'infografia-pap-protocolo-abcde.pdf' },
    { id: 'trec', file: 'infografia-trec-modelo-cognitivo.pdf' },
  ]
  for (const info of infografiasFiles) {
    const localPath = path.join(OUT_DIR, 'infografias', info.file)
    const key = `${R2_PREFIX}infografias/${info.file}`
    const body = fs.readFileSync(localPath)

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'application/pdf',
    }))
    fs.copyFileSync(localPath, path.join(LOCAL_MIRROR_DIR, 'infografias', info.file))
    console.log(`R2 OK -> ${key} (${(body.length / 1024).toFixed(1)} KB)`)
    mapClaves.infografias[info.id] = key
  }

  // C) Lecciones
  for (const leccion of lecciones) {
    const filename = `leccion-${leccion.numero}-${leccion.slug}.pdf`
    const localPath = path.join(OUT_DIR, 'lecciones', filename)
    const key = `${R2_PREFIX}lecciones/${filename}`
    const body = fs.readFileSync(localPath)

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'application/pdf',
    }))
    fs.copyFileSync(localPath, path.join(LOCAL_MIRROR_DIR, 'lecciones', filename))
    console.log(`R2 OK -> ${key} (${(body.length / 1024).toFixed(1)} KB)`)
    mapClaves.lecciones[leccion.numero] = key
  }

  return mapClaves
}

async function wireDatabase(mapClaves) {
  const sb = supabaseClient()
  console.log('--- 2. Cableando base de datos Supabase (Postgres) ---')

  // 1. Programa
  const { error: progErr } = await sb.from('programas').upsert({
    id: PROGRAMA_ID,
    titulo: PROGRAMA_TITULO,
    descripcion: PROGRAMA_DESCRIPCION,
    descripcion_larga: PROGRAMA_DESCRIPCION,
    tipo: 'formacion',
    publicado_en_home: true,
  })
  if (progErr) throw new Error(`Error en programas: ${progErr.message}`)
  console.log(`DB OK -> Programa registrado: ${PROGRAMA_ID}`)

  // Limpiar módulos viejos de este programa si existen (cascada borra lecciones y quiz_preguntas)
  const { data: modulosPrevios } = await sb.from('modulos').select('id').eq('programa_id', PROGRAMA_ID)
  if (modulosPrevios && modulosPrevios.length > 0) {
    console.log(`Limpiando ${modulosPrevios.length} módulos previos del programa...`)
    await sb.from('modulos').delete().eq('programa_id', PROGRAMA_ID)
  }

  // 2. Módulo -1: Resumen ejecutivo
  const { data: modResumen, error: modResErr } = await sb.from('modulos').insert({
    id: 'a2222222-2222-2222-2222-000000000000',
    programa_id: PROGRAMA_ID,
    titulo: 'Resumen ejecutivo (presentación)',
    descripcion: 'Síntesis ejecutiva y mapa conceptual de los 4 ejes formativos del programa.',
    orden: -1,
  }).select().single()
  if (modResErr) throw new Error(`Error en módulo resumen: ${modResErr.message}`)

  await sb.from('lecciones').insert({
    id: 'b2222222-2222-2222-2222-000000000001',
    programa_id: PROGRAMA_ID,
    modulo_id: modResumen.id,
    titulo: 'Presentación ejecutiva del programa',
    tipo_contenido: 'drive_pdf',
    url_recurso: `r2key://${mapClaves.presentacion}`,
    orden: 0,
    tipo_medio: 'pdf',
    origen: 'r2',
  })
  console.log('DB OK -> Módulo -1 creado con presentación ejecutiva')

  // 3. Módulos 1 al 4
  const modulosDef = [
    {
      id: 'a2222222-2222-2222-2222-000000000001',
      orden: 0,
      titulo: 'Módulo 1 · Marco ético, crisis y escucha',
      descripcion: 'Dónde termina el consejo pastoral y empieza la psicoterapia. Primeros Auxilios Psicológicos, planes de seguridad y escucha activa.',
      leccionesNumeros: [11, 12, 13, 14, 15],
      infografia: { id: 'pap', titulo: 'Infografía · Protocolo ABCDE en PAP (flujo de 5 pasos)', orden: 2 },
      quizKey: 'modulo_1',
    },
    {
      id: 'a2222222-2222-2222-2222-000000000002',
      orden: 1,
      titulo: 'Módulo 2 · Modelo cognitivo (TCC / TREC)',
      descripcion: 'El modelo ABC de Ellis, las distorsiones cognitivas más frecuentes en el liderazgo y la técnica de la flecha descendente.',
      leccionesNumeros: [21, 22, 23],
      infografia: { id: 'trec', titulo: 'Infografía · El Modelo ABCDE de la TREC en el Liderazgo Pastoral', orden: 1 },
      quizKey: 'modulo_2',
    },
    {
      id: 'a2222222-2222-2222-2222-000000000003',
      orden: 2,
      titulo: 'Módulo 3 · Aceptación y Compromiso (ACT)',
      descripcion: 'Flexibilidad psicológica: evitación experiencial, defusión cognitiva, valores y metáforas aplicadas al acompañamiento.',
      leccionesNumeros: [31, 32, 33, 34],
      infografia: null,
      quizKey: 'modulo_3',
    },
    {
      id: 'a2222222-2222-2222-2222-000000000004',
      orden: 3,
      titulo: 'Módulo 4 · Comunicación y autocuidado',
      descripcion: 'Comunicación asertiva, método socrático y prevención del burnout en el ministerio.',
      leccionesNumeros: [41, 49, 43, 44],
      infografia: null,
      quizKey: 'modulo_4',
      entregaFinal: true,
    },
  ]

  for (const mDef of modulosDef) {
    const { data: modRow, error: mErr } = await sb.from('modulos').insert({
      id: mDef.id,
      programa_id: PROGRAMA_ID,
      titulo: mDef.titulo,
      descripcion: mDef.descripcion,
      orden: mDef.orden,
    }).select().single()
    if (mErr) throw new Error(`Error en módulo ${mDef.titulo}: ${mErr.message}`)
    console.log(`DB OK -> Módulo creado: ${mDef.titulo}`)

    let ordenLeccion = 0

    // Insertar lecciones PDF del módulo
    for (const num of mDef.leccionesNumeros) {
      // Si hay infografía que va antes de cierto orden (ej. PAP después de tema 2)
      if (mDef.infografia && ordenLeccion === mDef.infografia.orden) {
        const infoKey = mapClaves.infografias[mDef.infografia.id]
        await sb.from('lecciones').insert({
          programa_id: PROGRAMA_ID,
          modulo_id: modRow.id,
          titulo: mDef.infografia.titulo,
          tipo_contenido: 'drive_pdf',
          url_recurso: `r2key://${infoKey}`,
          orden: ordenLeccion++,
          tipo_medio: 'pdf',
          origen: 'r2',
        })
        console.log(`  + Infografía: ${mDef.infografia.titulo}`)
      }

      const leccData = lecciones.find(l => l.numero === num)
      const r2Key = mapClaves.lecciones[num]
      await sb.from('lecciones').insert({
        programa_id: PROGRAMA_ID,
        modulo_id: modRow.id,
        titulo: `Tema ${leccData.temaNumero} · ${leccData.titulo}`,
        tipo_contenido: 'drive_pdf',
        url_recurso: `r2key://${r2Key}`,
        orden: ordenLeccion++,
        tipo_medio: 'pdf',
        origen: 'r2',
      })
      console.log(`  + Lección: Tema ${leccData.temaNumero} · ${leccData.titulo}`)
    }

    // Si la infografía no se insertó aún en este módulo
    if (mDef.infografia && ordenLeccion <= mDef.infografia.orden) {
      const infoKey = mapClaves.infografias[mDef.infografia.id]
      await sb.from('lecciones').insert({
        programa_id: PROGRAMA_ID,
        modulo_id: modRow.id,
        titulo: mDef.infografia.titulo,
        tipo_contenido: 'drive_pdf',
        url_recurso: `r2key://${infoKey}`,
        orden: ordenLeccion++,
        tipo_medio: 'pdf',
        origen: 'r2',
      })
      console.log(`  + Infografía: ${mDef.infografia.titulo}`)
    }

    // Insertar Quiz del Módulo
    const quizData = quizzes[mDef.quizKey]
    const { data: quizLeccion, error: qLErr } = await sb.from('lecciones').insert({
      programa_id: PROGRAMA_ID,
      modulo_id: modRow.id,
      titulo: quizData.titulo,
      tipo_contenido: 'quiz',
      url_recurso: '',
      orden: ordenLeccion++,
      tipo_medio: 'quiz',
      origen: 'r2',
    }).select().single()
    if (qLErr) throw new Error(`Error creando lección quiz: ${qLErr.message}`)
    console.log(`  + Quiz de Comprensión: ${quizData.titulo}`)

    // Insertar las 5 preguntas del quiz
    for (let qIdx = 0; qIdx < quizData.preguntas.length; qIdx++) {
      const p = quizData.preguntas[qIdx]
      const { error: pErr } = await sb.from('quiz_preguntas').insert({
        leccion_id: quizLeccion.id,
        pregunta: p.pregunta,
        opciones: p.opciones,
        respuesta_correcta: p.respuesta_correcta,
        orden: qIdx,
      })
      if (pErr) throw new Error(`Error en quiz_preguntas: ${pErr.message}`)
    }
    console.log(`    (5 preguntas registradas en quiz_preguntas)`)

    // Si es Módulo 4: Trabajo Final Integrador ('entrega')
    if (mDef.entregaFinal) {
      const consignaMarkdown = `# Trabajo Final Integrador · Proyecto de Contención Psicológica Pastoral (PCPP)

Diseñá el **Proyecto de Contención Psicológica Pastoral (PCPP)** de tu comunidad de fe. Extensión sugerida: 20 a 30 páginas.

## Ejes Requeridos

1. **Diagnóstico Comunitario**: Relevamiento anónimo de las principales necesidades emocionales y psicosociales detectadas en tu congregación.
2. **Protocolo de Primera Escucha**: Procedimiento pastoral formal para la recepción, escucha activa y contención de consultas.
3. **Sistema de Triaje**: Criterios del semáforo verde, amarillo y rojo para evaluar urgencia y riesgo vital.
4. **Red de Derivación Responsable**: Directorio verificado de psicólogos, psiquiatras, hospitales y centros de emergencia zonales.
5. **Plan de Autocuidado del Equipo**: Límites horarios, días de descanso no negociables y espacios de supervisión profesional.

> [!ERROR]
> **Protección de Datos (Ley 25.326)**: No incluyas datos que permitan identificar a ninguna persona real de tu comunidad. Si necesitás ilustrar con una situación, utilizá exclusivamente un caso ficticio o compuesto.

> [!DATO]
> Cada criterio se evalúa sobre 20 puntos (total 100). Se aprueba con 70 puntos.`

      await sb.from('lecciones').insert({
        id: 'b2222222-2222-2222-2222-000000000499',
        programa_id: PROGRAMA_ID,
        modulo_id: modRow.id,
        titulo: 'Trabajo Final Integrador · Proyecto de Contención Psicológica Pastoral',
        tipo_contenido: 'entrega',
        url_recurso: consignaMarkdown,
        orden: ordenLeccion++,
        tipo_medio: 'pdf',
        origen: 'r2',
      })
      console.log('  + Trabajo Final Integrador (tipo entrega) registrado')
    }
  }

  // 4. Cohorte de 8 semanas
  const { error: cohErr } = await sb.from('cohortes').upsert({
    id: 'c2222222-2222-2222-2222-000000000001',
    programa_id: PROGRAMA_ID,
    nombre: 'Cohorte 2026 · Dignos (Quilmes)',
    fecha_inicio: new Date().toISOString().split('T')[0],
  })
  if (cohErr) console.warn('Aviso en cohortes:', cohErr.message)
  else console.log('DB OK -> Cohorte registrada')

  console.log('¡Despliegue y cableado en Supabase completado con total éxito!')
}

async function main() {
  const mapClaves = await subirArchivosR2()
  await wireDatabase(mapClaves)
}

main().catch((err) => {
  console.error('Fallo en deploy:', err)
  process.exit(1)
})
