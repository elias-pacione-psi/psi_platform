import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CohortesClient } from './CohortesClient'

export const metadata = { title: 'Cohortes | Elias Pacione' }

export default async function CohortesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const [{ data: cohortes }, { data: programas }, { data: alumnos }] = await Promise.all([
    supabase
      .from('cohortes')
      .select('*, programas(titulo), cohortes_alumnos(alumno_id, alumnos(id, nombre, email))')
      .order('created_at', { ascending: false }),
    supabase.from('programas').select('id, titulo').order('titulo', { ascending: true }),
    supabase.from('alumnos').select('id, nombre, email').eq('estado', 'activo').eq('rol', 'alumno').order('nombre', { ascending: true }),
  ])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Cohortes</h1>
        <p className="text-muted-foreground mt-2 font-sans">Camadas que cursan un programa juntas. Inscribí alumnos y les das acceso al contenido automáticamente.</p>
      </div>
      <CohortesClient cohortes={cohortes || []} programas={programas || []} alumnos={alumnos || []} />
    </div>
  )
}
