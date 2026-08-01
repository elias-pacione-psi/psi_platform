import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { AdminLeccionesClient } from './AdminLeccionesClient'
import { redirect } from 'next/navigation'

export default async function AdminLeccionesPage(props: { params: Promise<{ programaId: string }> }) {
  const params = await props.params
  const programaId = params.programaId
  const supabase = await createClient()

  const { data: programa, error: progError } = await supabase
    .from('programas')
    .select('*')
    .eq('id', programaId)
    .single()

  if (progError || !programa) {
    redirect('/psicologo/programas')
  }

  const { data: modulos } = await supabase
    .from('modulos')
    .select('*')
    .eq('programa_id', programaId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: lecciones } = await supabase
    .from('lecciones')
    .select('*')
    .eq('programa_id', programaId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })

  // Preguntas de las lecciones de tipo quiz (el instructor sí puede verlas)
  const quizIds = (lecciones || []).filter(l => l.tipo_contenido === 'quiz').map(l => l.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let preguntasPorLeccion: Record<string, any[]> = {}
  if (quizIds.length > 0) {
    const { data: preguntas } = await supabase
      .from('quiz_preguntas')
      .select('id, leccion_id, pregunta, opciones, respuesta_correcta, orden')
      .in('leccion_id', quizIds)
      .order('orden', { ascending: true })
    preguntasPorLeccion = (preguntas || []).reduce((acc, p) => {
      (acc[p.leccion_id] ||= []).push(p)
      return acc
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any[]>)
  }

  // Firmar URLs de archivos subidos (para el link "Ver archivo" del editor)
  const firmadas = await firmarUrlsRecursos(lecciones || [])
  const leccionesParaCliente = (lecciones || []).map((l, i) => ({
    ...l,
    url_abrible: firmadas[i].url_recurso,
    preguntas: preguntasPorLeccion[l.id] || [],
  }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AdminLeccionesClient programa={programa} modulos={modulos || []} lecciones={leccionesParaCliente} />
    </div>
  )
}
