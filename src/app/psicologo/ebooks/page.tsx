import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { resolverUrlRecurso } from '@/utils/r2'
import { EbooksAdminClient } from './EbooksAdminClient'

export const metadata = { title: 'ebooks | Elias Pacione' }

export default async function EbooksAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  // count de órdenes pagadas por ebook: no hace falta un join pesado, con la cuenta
  // alcanza para la columna "Ventas" del listado. La fase 6 (panel de ventas) es la que
  // sí necesita el detalle fila por fila.
  const [{ data: ebooks, error }, { data: ordenes }] = await Promise.all([
    supabase.from('ebooks').select('*').order('created_at', { ascending: false }),
    supabase.from('ordenes').select('ebook_id').eq('estado', 'pagada'),
  ])

  if (error) {
    console.error('Error cargando ebooks:', error)
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-tinta">ebooks</h1>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans space-y-2">
          <p className="font-bold">No se pudieron cargar los ebooks.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  const ventasPorEbook = (ordenes ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.ebook_id] = (acc[o.ebook_id] ?? 0) + 1
    return acc
  }, {})

  // Miniatura de portada para la tabla: firmada acá, server-side, igual que en Biblioteca
  // — el bucket es privado, un <img src> directo con la key cruda no cargaría nada.
  const ebooksConVentas = await Promise.all((ebooks ?? []).map(async (e) => ({
    ...e,
    ventas: ventasPorEbook[e.id] ?? 0,
    portada_url: await resolverUrlRecurso(e.portada_key),
  })))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">ebooks</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          El único producto que se compra directo desde la web. El resto del contenido
          (cursos, formaciones) sigue asignándose desde Programas y Comisiones.
        </p>
      </div>
      <EbooksAdminClient ebooks={ebooksConVentas} />
    </div>
  )
}
