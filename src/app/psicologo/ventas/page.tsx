import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { VentasClient } from './VentasClient'

export const metadata = { title: 'Ventas | Elias Pacione' }

// Fase 6 de docs/plan-modelo-comercial.md. Facturación queda explícitamente FUERA de
// esta pantalla: emitir comprobante depende de qué proveedor de pago se termine usando y
// de la situación fiscal de Elias (monotributo, factura A/B), y ninguna de esas dos
// decisiones está tomada todavía — no es algo que se pueda resolver escribiendo código.
export default async function VentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const { data: ordenes, error } = await supabase
    .from('ordenes')
    .select('id, email_comprador, precio_cobrado, moneda, estado, created_at, pagada_at, ebooks(titulo)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error cargando ventas:', error)
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-tinta">Ventas</h1>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans space-y-2">
          <p className="font-bold">No se pudieron cargar las ventas.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

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
        <h1 className="text-4xl font-heading font-bold text-tinta">Ventas</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Todas las órdenes de ebooks. La facturación no está resuelta todavía — esto es
          solo el registro de qué se cobró y a quién.
        </p>
      </div>
      <VentasClient filas={filas} totalVentas={pagadas.length} ingresosCentavos={ingresosCentavos} />
    </div>
  )
}
