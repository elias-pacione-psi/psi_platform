import { createClient } from '@/utils/supabase/server'
import { AdminProgramasClient } from './AdminProgramasClient'

export default async function AdminProgramasPage() {
  const supabase = await createClient()

  // Programas con conteo de actividades
  const { data: programas, error } = await supabase
    .from('programas')
    .select('*, actividades(count)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error cargando datos.</div>
  }

  const programasFormateados = programas?.map(m => ({
    ...m,
    cantidad_actividades: m.actividades[0]?.count || 0
  })) || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AdminProgramasClient programas={programasFormateados} />
    </div>
  )
}
