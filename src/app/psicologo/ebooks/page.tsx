import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { resolverUrlRecurso } from '@/utils/r2'
import { EbooksAdminClient } from './EbooksAdminClient'
import { VentasClient } from '../ventas/VentasClient'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export const metadata = { title: 'ebooks | Elias Pacione' }

type Props = { searchParams: Promise<{ tab?: string }> }

// Ventas se fusionó acá (antes era su propia sección del sidebar): como el ebook es el
// único producto que se vende, "las ventas" siempre fueron ventas de ebooks — separarlas
// en dos páginas eran dos clics para ver una sola cosa. /psicologo/ventas redirige acá
// con ?tab=ventas para no romper links viejos.
export default async function EbooksAdminPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const { tab } = await searchParams
  const tabInicial = tab === 'ventas' ? 'ventas' : 'catalogo'

  // Una sola consulta a `ordenes` para las dos pestañas: antes ebooks pedía solo
  // `ebook_id` de las pagadas (para el contador por título) y ventas pedía el detalle
  // completo — mismos datos, dos round-trips. Con `ebook_id` sumado al select de acá
  // alcanza para derivar ambas vistas de un solo resultado.
  const [{ data: ebooks, error }, { data: ordenes, error: errorOrdenes }] = await Promise.all([
    supabase.from('ebooks').select('*').order('created_at', { ascending: false }),
    supabase
      .from('ordenes')
      .select('id, email_comprador, precio_cobrado, moneda, estado, created_at, pagada_at, ebook_id, ebooks(titulo)')
      .order('created_at', { ascending: false }),
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

  const ventasPorEbook = (ordenes ?? [])
    .filter((o) => o.estado === 'pagada')
    .reduce<Record<string, number>>((acc, o) => {
      acc[o.ebook_id] = (acc[o.ebook_id] ?? 0) + 1
      return acc
    }, {})

  // Miniatura de portada para la tabla: firmada acá, server-side — el bucket es
  // privado, un <img src> directo con la key cruda no cargaría nada.
  const ebooksConVentas = await Promise.all((ebooks ?? []).map(async (e) => ({
    ...e,
    ventas: ventasPorEbook[e.id] ?? 0,
    portada_url: await resolverUrlRecurso(e.portada_key),
  })))

  const filas = (ordenes ?? []).map((o) => ({
    id: o.id,
    email: o.email_comprador,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ebookTitulo: (o.ebooks as any)?.titulo ?? '(ebook eliminado)',
    precioCentavos: o.precio_cobrado,
    estado: o.estado as 'pendiente' | 'pagada' | 'fallida' | 'reembolsada',
    fecha: o.created_at,
  }))

  const pagadas = filas.filter((f) => f.estado === 'pagada')
  const ingresosCentavos = pagadas.reduce((acc, f) => acc + f.precioCentavos, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">ebooks</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          El único producto que se compra directo desde la web. El resto del contenido
          (cursos, formaciones) sigue asignándose desde Programas y Comisiones.
        </p>
      </div>

      <Tabs defaultValue={tabInicial}>
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
        </TabsList>
        <TabsContent value="catalogo">
          <EbooksAdminClient ebooks={ebooksConVentas} />
        </TabsContent>
        <TabsContent value="ventas">
          {errorOrdenes ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans space-y-2">
              <p className="font-bold">No se pudieron cargar las ventas.</p>
              <p className="text-sm">{errorOrdenes.message}</p>
            </div>
          ) : (
            <VentasClient filas={filas} totalVentas={pagadas.length} ingresosCentavos={ingresosCentavos} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
