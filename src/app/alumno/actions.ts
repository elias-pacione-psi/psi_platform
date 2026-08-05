'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/utils/supabase/guards'
import { createAdminClient } from '@/utils/supabase/admin'
import { corregirQuiz } from '@/utils/supabase/quiz'
import { firmarSubidaR2, r2Configurado } from '@/utils/r2'
import { marcarKeyR2, keyDeMarcadorR2, PREFIJO_ENTREGAS_R2 } from '@/utils/r2-marcador'

// Allowlist real: el Content-Type se firma junto con la URL de subida (ver
// firmarSubidaR2 en utils/r2.ts), así que lo que se acepte acá es literalmente lo único
// que R2 va a dejar escribir. Más variado que los materiales (documentos, planillas,
// comprimidos, imágenes), porque un trabajo entregado puede ser casi cualquier cosa.
const TIPOS_ENTREGA: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.oasis.opendocument.text': ['odt'],
  'application/vnd.ms-powerpoint': ['ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/zip': ['zip'],
  'text/plain': ['txt'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'video/mp4': ['mp4'],
  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
}

// Devuelve la extensión a usar en la key, o null si el par tipo/nombre no está
// permitido. La extensión sale de la allowlist y no del nombre que mandó el cliente.
function extensionPermitidaEntrega(contentType: string, nombreArchivo: string): string | null {
  const permitidas = TIPOS_ENTREGA[contentType.toLowerCase()]
  if (!permitidas) return null
  const escrita = nombreArchivo.split('.').pop()?.toLowerCase() ?? ''
  return permitidas.includes(escrita) ? escrita : permitidas[0]
}

// Espeja TAMANO_MAXIMO_MATERIAL_BYTES del gestor del psicólogo, más bajo porque un trabajo
// entregado no es material de curso. Sin ningún tope, la única cota de lo que se puede
// escribir en el bucket era la paciencia de quien subiera — y eso se paga en la factura de
// Cloudflare. Es una cota blanda (el tamaño lo declara el cliente), pero corta el abuso
// casual; el techo duro va en una regla de lifecycle del bucket.
const TAMANO_MAXIMO_ENTREGA_BYTES = 100 * 1024 * 1024 // 100 MB

export async function obtenerUrlSubidaEntregaR2(
  nombreArchivo: string,
  contentType: string,
  leccionId: string,
  tamanoBytes: number,
) {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { user } = auth

  // A diferencia de una lección (que se degrada a la URL vieja si falta configurar R2),
  // una entrega no tiene a qué degradarse: mejor cortar antes de prometerle al alumno
  // una subida que va a fallar con un error críptico del SDK.
  if (!r2Configurado()) return { error: 'La subida de archivos no está disponible todavía.' }

  if (!Number.isFinite(tamanoBytes) || tamanoBytes <= 0) return { error: 'Archivo inválido.' }
  if (tamanoBytes > TAMANO_MAXIMO_ENTREGA_BYTES) {
    return { error: `El archivo supera el máximo de ${TAMANO_MAXIMO_ENTREGA_BYTES / 1024 / 1024} MB.` }
  }

  const extension = extensionPermitidaEntrega(contentType, nombreArchivo)
  if (!extension) return { error: `No se aceptan archivos de tipo "${contentType || 'desconocido'}".` }

  // La key la arma el servidor con el uid de la sesión, nunca con algo que venga del
  // cliente: es lo que reemplaza al aislamiento por carpeta que daba la policy de
  // Storage de Supabase. leccionId va en el nombre solo para que un vistazo al bucket
  // crudo diga de qué trabajo es — la relación real vive en entregas.leccion_id.
  const aleatorio = crypto.randomUUID().split('-')[0]
  const key = `${PREFIJO_ENTREGAS_R2}${user.id}/${leccionId}_${aleatorio}.${extension}`

  try {
    const url = await firmarSubidaR2(key, contentType)
    return { success: true, url, key: marcarKeyR2(key) }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo generar la URL de subida' }
  }
}

// Verifica que el alumno tenga acceso al programa Y que la lección sea de ese programa
// (RLS respalda lo primero; lo segundo no lo puede ver ninguna policy).
//
// Los dos ids llegan del cliente y antes sólo se validaba el programa, que es justo el que
// el atacante elige. Con un programaId propio y un leccionId ajeno se podía llegar a una
// lección de un programa no asignado — y en responderQuiz eso era serio, porque
// corregirQuiz() corre con service-role y no valida acceso: devolvía la clave de
// respuestas del quiz de otro programa. Que los UUIDs no se puedan enumerar lo hacía
// difícil, no imposible: la impredecibilidad de un id no es control de acceso.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tieneAccesoALeccion(supabase: any, userId: string, programaId: string, leccionId: string) {
  const [{ data: asignacion }, { data: leccion }] = await Promise.all([
    supabase
      .from('programas_asignados')
      .select('programa_id')
      .eq('alumno_id', userId)
      .eq('programa_id', programaId)
      .maybeSingle(),
    supabase
      .from('lecciones')
      .select('id')
      .eq('id', leccionId)
      .eq('programa_id', programaId)
      .maybeSingle(),
  ])
  return Boolean(asignacion && leccion)
}

export async function marcarLeccionCompletada(leccionId: string, programaId: string, completado: boolean) {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  if (!(await tieneAccesoALeccion(supabase, user.id, programaId, leccionId))) return { error: 'No autorizado' }

  if (completado) {
    const { error } = await supabase
      .from('progreso_lecciones')
      .upsert({ alumno_id: user.id, leccion_id: leccionId, completado: true, completado_at: new Date().toISOString() },
        { onConflict: 'alumno_id,leccion_id' })
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('progreso_lecciones')
      .delete()
      .eq('alumno_id', user.id)
      .eq('leccion_id', leccionId)
    if (error) return { error: error.message }
  }

  revalidatePath(`/alumno/programas/${programaId}`)
  revalidatePath(`/alumno/programas/${programaId}/leccion/${leccionId}`)
  return { success: true }
}

// Sin un tope, el propio feedback era el exploit: el primer envío (con cualquier cosa)
// devolvía `solucion` con la respuesta correcta de cada pregunta, y alcanzaba con reenviar
// con ésas para aprobar. El umbral del 70% sólo significa algo si los intentos son finitos.
const MAXIMO_INTENTOS_QUIZ = 3

export async function responderQuiz(leccionId: string, programaId: string, respuestas: Record<string, string>) {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  if (!(await tieneAccesoALeccion(supabase, user.id, programaId, leccionId))) return { error: 'No autorizado' }

  // Se cuenta con service-role y no con el cliente del usuario porque el conteo tiene que
  // ver TODOS los intentos, no los que deje pasar la RLS — y porque quiz_intentos no tiene
  // policy de insert, así que esta tabla ya se toca únicamente desde acá.
  const supabaseAdmin = createAdminClient()
  const { count: intentosPrevios } = await supabaseAdmin
    .from('quiz_intentos')
    .select('*', { count: 'exact', head: true })
    .eq('alumno_id', user.id)
    .eq('leccion_id', leccionId)

  const yaUsados = intentosPrevios ?? 0

  // Quien ya aprobó puede seguir entrando a repasar el quiz resuelto; lo que se corta es
  // seguir intentando después de agotar los intentos SIN haber aprobado.
  if (yaUsados >= MAXIMO_INTENTOS_QUIZ) {
    const { data: aprobadoPrevio } = await supabaseAdmin
      .from('quiz_intentos')
      .select('id')
      .eq('alumno_id', user.id)
      .eq('leccion_id', leccionId)
      .eq('aprobado', true)
      .limit(1)
      .maybeSingle()

    if (!aprobadoPrevio) {
      return { error: `Ya usaste tus ${MAXIMO_INTENTOS_QUIZ} intentos. Escribile a tu instructor.` }
    }
  }

  // Corrección server-side (las respuestas correctas nunca viajan antes del envío)
  const resultado = await corregirQuiz(leccionId, respuestas)
  if (!resultado) return { error: 'No se pudieron cargar las preguntas' }

  // Con service-role: la tabla no tiene policy de insert para authenticated (ver
  // schema.sql), así que un resultado de quiz solo puede entrar por acá, ya corregido
  // en el servidor — nunca con un puntaje/aprobado que el alumno mande directo a la API.
  const { error: errIntento } = await supabaseAdmin.from('quiz_intentos').insert({
    alumno_id: user.id,
    leccion_id: leccionId,
    puntaje: resultado.puntaje,
    total: resultado.total,
    aprobado: resultado.aprobado,
  })
  if (errIntento) return { error: errIntento.message }

  // Si aprobó, marca la lección como completada
  if (resultado.aprobado) {
    await supabase.from('progreso_lecciones').upsert(
      { alumno_id: user.id, leccion_id: leccionId, completado: true, completado_at: new Date().toISOString() },
      { onConflict: 'alumno_id,leccion_id' })
  }

  revalidatePath(`/alumno/programas/${programaId}`)
  revalidatePath(`/alumno/programas/${programaId}/leccion/${leccionId}`)

  // La respuesta correcta se revela sólo cuando ya no sirve para reintentar: o aprobó, o
  // se le acabaron los intentos. Mientras queden, el feedback dice qué estuvo mal pero no
  // cuál era la buena — si no, el primer envío es la clave de respuestas del segundo.
  const intentosRestantes = Math.max(0, MAXIMO_INTENTOS_QUIZ - (yaUsados + 1))
  const revelarSolucion = resultado.aprobado || intentosRestantes === 0

  return {
    success: true,
    puntaje: resultado.puntaje,
    total: resultado.total,
    aprobado: resultado.aprobado,
    intentosRestantes,
    solucion: revelarSolucion
      ? resultado.solucion
      : Object.fromEntries(
          Object.entries(resultado.solucion).map(([id, s]) => [id, { acertada: s.acertada }]),
        ),
  }
}

// El archivo ya se subió (R2, marca r2key://entregas/{uid}/..., o el bucket 'entregas'
// de Supabase con las viejas, path {uid}/...) desde el cliente. Acá registramos la
// fila. Marca la lección de entrega como completada.
// El paso de "subí el archivo" a "registrá la entrega" son dos requests distintos, así
// que la key vuelve por el cliente y hay que desconfiar de ella: sin este chequeo, un
// alumno podría registrar como propia la key de otro y leerla firmada desde Tareas.
function perteneceAlAlumno(path: string, uid: string): boolean {
  const keyR2 = keyDeMarcadorR2(path)
  if (keyR2) return keyR2.startsWith(`${PREFIJO_ENTREGAS_R2}${uid}/`)
  return path.startsWith(`${uid}/`)
}

export async function registrarEntrega(leccionId: string, programaId: string, archivoPath: string, comentario: string) {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  if (!(await tieneAccesoALeccion(supabase, user.id, programaId, leccionId))) return { error: 'No autorizado' }
  if (!archivoPath || !perteneceAlAlumno(archivoPath, user.id)) return { error: 'Ruta de archivo inválida' }

  const { error } = await supabase.from('entregas').upsert({
    leccion_id: leccionId,
    alumno_id: user.id,
    archivo_url: archivoPath,
    comentario_alumno: comentario?.trim() || null,
    estado: 'entregada',
  }, { onConflict: 'leccion_id,alumno_id' })

  if (error) return { error: error.message }

  await supabase.from('progreso_lecciones').upsert(
    { alumno_id: user.id, leccion_id: leccionId, completado: true, completado_at: new Date().toISOString() },
    { onConflict: 'alumno_id,leccion_id' })

  revalidatePath(`/alumno/programas/${programaId}`)
  revalidatePath(`/alumno/programas/${programaId}/leccion/${leccionId}`)
  return { success: true }
}
