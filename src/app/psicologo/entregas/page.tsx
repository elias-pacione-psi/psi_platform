import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { firmarUrlEntrega } from '@/utils/supabase/recursos'
import { EntregasClient } from './EntregasClient'

export const metadata = { title: 'Entregas | Elias Pacione' }

export default async function EntregasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const { data: entregas } = await supabase
    .from('entregas')
    .select('*, lecciones(titulo, programa_id, programas(titulo)), alumnos(nombre, email)')
    .order('updated_at', { ascending: false })

  // Firmar el archivo de cada entrega (bucket privado)
  const entregasFirmadas = await Promise.all(
    (entregas || []).map(async (e) => ({ ...e, archivo_firmado: await firmarUrlEntrega(e.archivo_url) }))
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Entregas</h1>
        <p className="text-muted-foreground mt-2 font-sans">Trabajos que subieron los alumnos. Descargalos, dejá tu devolución y marcalos como revisados.</p>
      </div>
      <EntregasClient entregas={entregasFirmadas} />
    </div>
  )
}
