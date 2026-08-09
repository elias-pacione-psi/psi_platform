import { createClient } from '@/utils/supabase/server'
import { resolverUrlRecurso } from '@/utils/r2'
import { AdminProgramasClient } from './AdminProgramasClient'

export default async function AdminProgramasPage() {
  const supabase = await createClient()

  // Programas con conteo de lecciones
  const { data: programas, error } = await supabase
    .from('programas')
    .select('*, lecciones(count)')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error cargando datos.</div>
  }

  // Miniatura de portada para la tabla: firmada acá, server-side — el bucket es
  // privado, un <img src> directo con la key cruda no cargaría nada.
  const programasFormateados = await Promise.all((programas ?? []).map(async (m) => ({
    ...m,
    cantidad_lecciones: m.lecciones[0]?.count || 0,
    portada_url: await resolverUrlRecurso(m.portada_key),
  })))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AdminProgramasClient programas={programasFormateados} />
    </div>
  )
}
