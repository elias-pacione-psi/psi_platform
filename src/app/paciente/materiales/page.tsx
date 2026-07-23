import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { BibliotecaClient } from './BibliotecaClient'

export const metadata = { title: 'Mis materiales | Espacio Terapéutico' }

export default async function MaterialesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: recursos } = await supabase
    .from('biblioteca_recursos')
    .select('*, recursos_asignados!inner(paciente_id)')
    .eq('recursos_asignados.paciente_id', user?.id)
    .order('created_at', { ascending: false })

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
