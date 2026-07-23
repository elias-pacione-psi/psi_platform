import { createClient } from '@/utils/supabase/server'
import { AdminPacientesClient } from './AdminPacientesClient'

export default async function AdminPacientesPage() {
  const supabase = await createClient()

  const [{ data: pacientes, error: pacientesError }, { data: programas, error: programasError }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('*, programas_asignados(programa_id)')
      .order('nombre', { ascending: true }),
    supabase
      .from('programas')
      .select('*')
      .order('titulo', { ascending: true }),
  ])

  if (pacientesError || programasError) {
    console.error("Error fetching critical admin data:", { pacientesError, programasError })
    return (
      <div className="p-8 text-center text-red-600 font-sans">
        <h2 className="text-2xl font-bold font-heading mb-4">Error cargando datos del panel</h2>
        <p>Revisá la consola del servidor para más detalles sobre pacientes o programas.</p>
      </div>
    )
  }

  // Inyectar un array limpio de programaIds asignados
  const pacientesList = pacientes?.map(p => ({
    ...p,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    programasSeleccionados: p.programas_asignados?.map((m: any) => m.programa_id) || []
  })) || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Pacientes</h1>
        <p className="text-muted-foreground mt-2 font-sans">Creá pacientes, gestioná sus datos de contacto y asignales programas de contenido.</p>
      </div>

      <AdminPacientesClient
        pacientes={pacientesList}
        todosLosProgramas={programas || []}
      />
    </div>
  )
}
