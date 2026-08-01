import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { BibliotecaClient } from './BibliotecaClient'

export const metadata = { title: 'Mis materiales | Elias Pacione' }

type Recurso = { id: string; titulo: string; tipo_contenido: string; url_recurso: string }

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
    recursos = (recursosAsignados || []).map(({ id, titulo, tipo_contenido, url_recurso }) => ({ id, titulo, tipo_contenido, url_recurso }))
  }

  // Los archivos del bucket privado se sirven con URL firmada
  const recursosFirmados = await firmarUrlsRecursos(recursos || [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Materiales</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Recursos de apoyo que tu psicólogo habilitó para vos.
        </p>
      </div>

      <BibliotecaClient recursos={recursosFirmados} />
    </div>
  )
}
