import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { PacientesClient } from './PacientesClient'

export const metadata = { title: 'Pacientes | Elias Pacione' }

// Pacientes: la misma cuenta que un alumno, sin el contenido de cursos. Lo que se
// administra desde acá es la agenda (sesiones que se avisan por email) y el material
// puntual que el psicólogo le entrega desde Biblioteca — nada clínico, ver AGENTS.md.
//
// El vínculo NO es excluyente: quien además cursa una formación aparece también en
// Alumnos, con un chip que lo aclara en las dos listas.
export default async function AdminPacientesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('alumnos')
    .select('rol')
    .eq('id', user.id)
    .single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const [{ data: pacientes, error: errorPacientes }, { data: recursos }] = await Promise.all([
    supabase
      .from('alumnos')
      .select('*, recursos_asignados(recurso_id)')
      .eq('es_paciente', true)
      .order('nombre', { ascending: true }),
    // Todo lo que hay en Biblioteca, no solo los PDF: el psicólogo decide qué entregar
    // (un libro, un audio, una guía de la carpeta Herramientas de Terapia).
    supabase
      .from('biblioteca_recursos')
      .select('id, titulo, tipo_contenido')
      .order('titulo', { ascending: true }),
  ])

  if (errorPacientes) {
    console.error('Error cargando pacientes:', errorPacientes)
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400 font-sans">
        <h2 className="text-2xl font-bold font-heading mb-4">Error cargando pacientes</h2>
        <p>Revisá la consola del servidor para más detalles.</p>
      </div>
    )
  }

  const ids = (pacientes ?? []).map((p: { id: string }) => p.id)

  // Próxima sesión de cada uno: una sola query para todos, ordenada, y se queda con la
  // primera de cada paciente. Traer la agenda por fila sería una query por paciente.
  const proximaPorPaciente = new Map<string, { fecha_hora: string; tipo: string }>()
  if (ids.length > 0) {
    const { data: sesiones } = await supabase
      .from('agenda_sesiones')
      .select('alumno_id, fecha_hora, tipo')
      .in('alumno_id', ids)
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true })

    for (const s of sesiones ?? []) {
      if (s.alumno_id && !proximaPorPaciente.has(s.alumno_id)) {
        proximaPorPaciente.set(s.alumno_id, { fecha_hora: s.fecha_hora, tipo: s.tipo })
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lista = (pacientes ?? []).map((p: any) => ({
    ...p,
    materialesAsignados: (p.recursos_asignados ?? []).map((r: { recurso_id: string }) => r.recurso_id),
    proximaSesion: proximaPorPaciente.get(p.id) ?? null,
  }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Pacientes</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Creá pacientes, gestioná sus datos de contacto y entregales material de la
          Biblioteca. Las sesiones se agendan desde <b>Agenda</b> y se avisan por email.
        </p>
      </div>

      <PacientesClient pacientes={lista} recursos={recursos || []} />
    </div>
  )
}
