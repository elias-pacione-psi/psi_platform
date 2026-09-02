import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { BibliotecaClient } from './BibliotecaClient'

export const metadata = { title: 'Biblioteca | Elias Pacione' }

type Recurso = { id: string; titulo: string; tipo_contenido: string; url_recurso: string }

// Mezcla los recursos asignados a mano (recursos_asignados) con los que le llegan por las
// comisiones en las que está inscripto (Libros y Documentos de la formación, tabla puente
// cohortes_recursos). El acceso real lo define la policy biblioteca_select — que cubre los
// dos caminos —; la doble query acá es cinturón y tirantes contra la RLS, mismo criterio
// que el resto del proyecto. El join por comisión se hace con queries simples (cohorte →
// puente → recursos) en vez de un embed profundo de PostgREST: cada paso es una query
// plana con RLS garantizada.
export default async function MaterialesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user?.id).single()
  const esPsicologo = perfil?.rol === 'psicologo'

  let recursos: Recurso[] = []
  if (esPsicologo) {
    const { data: todosRecursos } = await supabase
      .from('biblioteca_recursos')
      .select('id, titulo, tipo_contenido, url_recurso')
      .order('created_at', { ascending: false })
    recursos = todosRecursos || []
  } else {
    const { data: recursosAsignados } = await supabase
      .from('biblioteca_recursos')
      .select('id, titulo, tipo_contenido, url_recurso, recursos_asignados!inner(alumno_id)')
      .eq('recursos_asignados.alumno_id', user?.id)
      .order('created_at', { ascending: false })
    const directos: Recurso[] = (recursosAsignados || []).map(({ id, titulo, tipo_contenido, url_recurso }) => ({ id, titulo, tipo_contenido, url_recurso }))

    // Camino por comisión: cohortes propias → recursos adjuntos → filas de biblioteca.
    // Si la tabla puente todavía no existe (migración 2026-09-02 sin correr), la lista
    // queda vacía y la Biblioteca muestra solo lo asignado a mano, como siempre.
    const porComision: Recurso[] = []
    const { data: inscripciones, error: errorInscripciones } = await supabase
      .from('cohortes_alumnos')
      .select('cohorte_id')
      .eq('alumno_id', user?.id)

    if (errorInscripciones) {
      console.warn('No se pudieron leer las inscripciones:', errorInscripciones.message)
    }

    const idsCohortes = (inscripciones ?? []).map((i: { cohorte_id: string }) => i.cohorte_id)
    if (idsCohortes.length > 0) {
      const { data: puente, error: errorPuente } = await supabase
        .from('cohortes_recursos')
        .select('recurso_id')
        .in('cohorte_id', idsCohortes)

      if (errorPuente) {
        console.warn('No se pudieron leer los recursos de las comisiones:', errorPuente.message)
      }

      const idsRecursos = [...new Set((puente ?? []).map((p: { recurso_id: string }) => p.recurso_id))]
      if (idsRecursos.length > 0) {
        const { data: filas, error: errorFilas } = await supabase
          .from('biblioteca_recursos')
          .select('id, titulo, tipo_contenido, url_recurso')
          .in('id', idsRecursos)
          .order('created_at', { ascending: false })
        if (errorFilas) {
          console.warn('No se pudieron leer los recursos de las comisiones:', errorFilas.message)
        } else {
          porComision.push(...(filas || []))
        }
      }
    }

    // Un recurso puede llegar por los dos caminos (asignado a mano Y por una comisión):
    // sin el dedupe aparecería dos veces en la lista.
    const vistos = new Set<string>()
    recursos = [...directos, ...porComision].filter((r) => {
      if (vistos.has(r.id)) return false
      vistos.add(r.id)
      return true
    })
  }

  // Los archivos del bucket privado se sirven con URL firmada
  const recursosFirmados = await firmarUrlsRecursos(recursos || [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Biblioteca</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Recursos de apoyo que tu psicólogo habilitó para vos.
        </p>
      </div>

      <BibliotecaClient recursos={recursosFirmados} />
    </div>
  )
}
