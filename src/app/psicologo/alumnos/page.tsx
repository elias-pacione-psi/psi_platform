import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { AdminAlumnosClient } from './AdminAlumnosClient'

export default async function AdminAlumnosPage() {
  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()

  const [
    { data: alumnos, error: alumnosError },
    { data: programas, error: programasError },
    { data: lecciones },
    { data: solicitudes, error: solicitudesError }
  ] = await Promise.all([
    supabase
      .from('alumnos')
      .select(`
        *,
        programas_asignados(programa_id),
        cohortes_alumnos(
          cohortes(nombre)
        ),
        progreso_lecciones(leccion_id),
        entregas(estado)
      `)
      .order('nombre', { ascending: true }),
    supabase
      .from('programas')
      .select('*')
      .order('titulo', { ascending: true }),
    supabase
      .from('lecciones')
      .select('id, programa_id'),
    // Solo las pendientes: una vez aprobada o rechazada, la solicitud sale de la bandeja
    // (la fila queda en la tabla, pero el panel muestra lo que falta resolver).
    supabaseAdmin
      .from('solicitudes_registro')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false })
  ])

  if (alumnosError || programasError || solicitudesError) {
    console.error("Error fetching critical admin data:", { alumnosError, programasError, solicitudesError })
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400 font-sans">
        <h2 className="text-2xl font-bold font-heading mb-4">Error cargando datos del panel</h2>
        <p>Revisá la consola del servidor para más detalles sobre alumnos o programas.</p>
      </div>
    )
  }

  // Inyectar array limpio y precalcular estados educativos
  const alumnosList = alumnos?.map((a: any) => {
    const programasSeleccionados = a.programas_asignados?.map((m: any) => m.programa_id) || []
    
    // Cohorte más reciente (tomamos la primera como ref)
    const cohorteInfo = a.cohortes_alumnos?.[0]?.cohortes
    const cohorteNombre = cohorteInfo?.nombre || 'Sin comisión'

    // Progreso
    const totalLeccionesAlumno = lecciones?.filter(l => programasSeleccionados.includes(l.programa_id)).length || 0
    const completadas = a.progreso_lecciones?.length || 0
    const porcentaje = totalLeccionesAlumno > 0 ? Math.round((completadas / totalLeccionesAlumno) * 100) : 0
    const progresoTexto = totalLeccionesAlumno > 0 ? `${completadas}/${totalLeccionesAlumno} · ${porcentaje}%` : '0/0 · 0%'

    // Entregas
    // Si tiene alguna entrega pendiente ("entregada" esperando revisión) mostramos "Pendiente" o "Requiere acción"
    const pendientes = a.entregas?.filter((e: any) => e.estado === 'entregada').length || 0
    const revisadas = a.entregas?.filter((e: any) => e.estado === 'revisada').length || 0
    let estadoEntregas = 'Sin entregas'
    if (pendientes > 0) estadoEntregas = `${pendientes} pendientes de revisión`
    else if (revisadas > 0) estadoEntregas = 'Al día (revisadas)'

    return {
      ...a,
      programasSeleccionados,
      cohorteNombre,
      progresoTexto,
      estadoEntregas,
    }
  }) || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Alumnos</h1>
        <p className="text-muted-foreground mt-2 font-sans">Creá alumnos, gestioná sus datos de contacto y asignales programas de contenido.</p>
      </div>

      <AdminAlumnosClient
        alumnos={alumnosList}
        todosLosProgramas={programas || []}
        solicitudes={solicitudes || []}
      />
    </div>
  )
}
