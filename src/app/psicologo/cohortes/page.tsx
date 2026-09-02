import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CohortesClient } from './CohortesClient'

export const metadata = { title: 'Formaciones | Elias Pacione' }

export default async function CohortesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const ahora = new Date().toISOString()

  const [{ data: cohortes, error: errorCohortes }, { data: programas }, { data: alumnos }, { data: clases }, { data: recursos }] = await Promise.all([
    // `programas` NO se embebe directo: desde que existe cohortes_programas hay dos
    // caminos entre cohortes y programas (el FK viejo cohortes.programa_id y la tabla
    // puente), y PostgREST rechaza el embed por ambiguo — "more than one relationship
    // was found". Se pide explícitamente a través de la tabla puente.
    supabase
      .from('cohortes')
      .select(`
        id, nombre, fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin, created_at,
        cohortes_programas(programa_id, programas(id, titulo)),
        cohortes_recursos(recurso_id, biblioteca_recursos(id, titulo, tipo_medio, tipo_contenido)),
        cohortes_alumnos(alumno_id, alumnos(id, nombre, email))
      `)
      .order('created_at', { ascending: false }),
    supabase.from('programas').select('id, titulo').order('titulo', { ascending: true }),
    supabase.from('alumnos').select('id, nombre, email').eq('estado', 'activo').eq('rol', 'alumno').order('nombre', { ascending: true }),
    // Para saber si una formación ya tiene clases agendadas y cuántas quedan por delante.
    supabase.from('agenda_sesiones').select('cohorte_id, fecha_hora').not('cohorte_id', 'is', null),
    // Para el selector de "Libros y Documentos" del formulario: todo lo que hay en la
    // Biblioteca (el psicólogo ve todo por RLS). Lo adjunto a cada comisión viene por el
    // embed de cohortes_recursos de arriba.
    supabase.from('biblioteca_recursos').select('id, titulo, tipo_medio, tipo_contenido').order('titulo', { ascending: true }),
  ])

  // Sin esto el error se comía en silencio: `cohortes` venía null, la página mostraba
  // "todavía no hay formaciones" y parecía que no se guardaban.
  if (errorCohortes) {
    console.error('Error cargando formaciones:', errorCohortes)
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-tinta">Formaciones</h1>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans space-y-2">
          <p className="font-bold">No se pudieron cargar las formaciones.</p>
          <p className="text-sm">{errorCohortes.message}</p>
        </div>
      </div>
    )
  }

  const clasesPorCohorte = (clases ?? []).reduce<Record<string, { total: number; futuras: number }>>((acc, c) => {
    const id = c.cohorte_id as string
    acc[id] ??= { total: 0, futuras: 0 }
    acc[id].total++
    if (c.fecha_hora >= ahora) acc[id].futuras++
    return acc
  }, {})

  const cohortesConDatos = (cohortes ?? []).map((c) => ({
    ...c,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    programas: (c.cohortes_programas ?? []).map((cp: any) => cp.programas).filter(Boolean),
    programaIds: (c.cohortes_programas ?? []).map((cp: { programa_id: string }) => cp.programa_id),
    // Libros y Documentos adjuntos a la formación (aparte de los programas).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recursos: (c.cohortes_recursos ?? []).map((cr: any) => cr.biblioteca_recursos).filter(Boolean),
    recursoIds: (c.cohortes_recursos ?? []).map((cr: { recurso_id: string }) => cr.recurso_id),
    clases: clasesPorCohorte[c.id] ?? { total: 0, futuras: 0 },
  }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Formaciones</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Camadas que cursan juntas. Inscribí alumnos y les das acceso al contenido automáticamente;
          con un horario cargado, además podés generarles las clases en la agenda.
        </p>
      </div>
      <CohortesClient
        cohortes={cohortesConDatos}
        programas={programas || []}
        alumnos={alumnos || []}
        recursos={recursos || []}
      />
    </div>
  )
}
