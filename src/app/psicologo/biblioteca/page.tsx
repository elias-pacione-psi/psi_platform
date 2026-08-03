import { createClient } from '@/utils/supabase/server'
import { firmarUrlsRecursos } from '@/utils/supabase/recursos'
import { asegurarCarpetasBibliotecaR2, sincronizarBibliotecaR2 } from '@/utils/supabase/biblioteca-r2'
import { BibliotecaAdminClient } from './BibliotecaAdminClient'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Biblioteca | Elias Pacione' }

export default async function AdminBibliotecaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('alumnos')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  // Espejo de la carpeta "Biblioteca R2" del bucket antes de leer: así lo que se subió
  // desde el gestor de archivos (o directo desde el panel de Cloudflare) ya está acá.
  // Best-effort — si el bucket no responde, se muestra lo que haya en la tabla.
  await asegurarCarpetasBibliotecaR2()
  const sincronizacion = await sincronizarBibliotecaR2(supabase)
  if ('error' in sincronizacion) {
    console.error('No se pudo sincronizar Biblioteca R2:', sincronizacion.error)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recursos: any[] = []

  try {
    const { data } = await supabase
      .from('biblioteca_recursos')
      .select('*, recursos_asignados(alumno_id)')
      .order('created_at', { ascending: false })
    if (data) recursos = data
  } catch (err) {
    console.error("No se pudo cargar la biblioteca. ¿La tabla fue creada?", err)
  }

  // Para el botón "Abrir": los archivos del bucket privado necesitan URL firmada
  const recursosFirmados = await firmarUrlsRecursos(recursos)
  // Conservamos el path original para editar/asignar sin romper la referencia
  const recursosParaCliente = recursos.map((r, i) => ({ ...r, url_abrible: recursosFirmados[i].url_recurso }))

  const { data: alumnos } = await supabase
    .from('alumnos')
    .select('id, nombre, email')
    .eq('estado', 'activo')
    .eq('rol', 'alumno')
    .order('nombre', { ascending: true })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-heading font-bold text-tinta">Biblioteca de recursos</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Materiales de apoyo sueltos (fuera de los programas), con asignación estricta por alumno.
        </p>
        <p className="text-muted-foreground mt-2 font-sans text-sm">
          Lo que subas a la carpeta <span className="font-mono text-tinta">Biblioteca R2</span> desde{' '}
          <Link href="/psicologo/archivos" className="text-marca underline underline-offset-2">Archivos</Link>{' '}
          aparece acá solo. Solo falta darle acceso a los alumnos con el botón de accesos.
        </p>
      </div>

      <BibliotecaAdminClient recursos={recursosParaCliente} alumnos={alumnos || []} />
    </div>
  )
}
