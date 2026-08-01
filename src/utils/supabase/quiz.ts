import { createAdminClient } from '@/utils/supabase/admin'

// Quiz educativo (comprensión), NO instrumento clínico.
// Las preguntas viven en quiz_preguntas, tabla que el alumno NUNCA lee vía API
// (contiene respuesta_correcta). Estos helpers usan service-role: uno entrega las
// preguntas SIN la respuesta, el otro corrige en el servidor. El caller debe haber
// verificado antes que el alumno tiene acceso al programa de esa lección.

export type PreguntaPublica = {
  id: string
  pregunta: string
  opciones: string[]
}

const UMBRAL_APROBACION = 0.7 // 70%

// Preguntas para mostrar al alumno, sin la respuesta correcta.
export async function obtenerPreguntasSinRespuesta(leccionId: string): Promise<PreguntaPublica[]> {
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin
    .from('quiz_preguntas')
    .select('id, pregunta, opciones, orden')
    .eq('leccion_id', leccionId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map((p) => ({
    id: p.id,
    pregunta: p.pregunta,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    opciones: Array.isArray(p.opciones) ? (p.opciones as any[]).map(String) : [],
  }))
}

export type ResultadoQuiz = {
  puntaje: number
  total: number
  aprobado: boolean
  // por pregunta: qué respondió y cuál era la correcta (para feedback post-envío)
  solucion: Record<string, { correcta: string; acertada: boolean }>
}

// Corrige en el servidor. Las respuestas correctas nunca viajan antes del envío.
export async function corregirQuiz(
  leccionId: string,
  respuestas: Record<string, string>
): Promise<ResultadoQuiz | null> {
  const supabaseAdmin = createAdminClient()
  const { data: preguntas, error } = await supabaseAdmin
    .from('quiz_preguntas')
    .select('id, respuesta_correcta')
    .eq('leccion_id', leccionId)

  if (error || !preguntas || preguntas.length === 0) return null

  let puntaje = 0
  const solucion: ResultadoQuiz['solucion'] = {}
  for (const p of preguntas) {
    const acertada = respuestas[p.id] === p.respuesta_correcta
    if (acertada) puntaje++
    solucion[p.id] = { correcta: p.respuesta_correcta, acertada }
  }
  const total = preguntas.length
  return { puntaje, total, aprobado: puntaje / total >= UMBRAL_APROBACION, solucion }
}
