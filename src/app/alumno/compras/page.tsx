import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ShoppingBag } from 'lucide-react'
import { ComprasClient } from './ComprasClient'

export const metadata = { title: 'Mis compras | Elias Pacione' }

const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

// Sin esta página, la promesa de "creá una cuenta y volvé a descargarlo cuando quieras"
// del CTA en /pedido/[id] quedaría rota: era el único paso que faltaba para que la
// cuenta post-compra (fase 5 del plan) sirviera para algo más que un mensaje de
// confirmación.
export default async function ComprasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // RLS (ordenes_select_propia) ya limita esto a las órdenes de este alumno_id — no
  // hace falta un .eq('alumno_id', user.id) para la seguridad, pero lo dejamos explícito
  // para que la consulta se entienda sin tener que ir a leer la policy.
  const { data: ordenes } = await supabase
    .from('ordenes')
    .select('id, estado, precio_cobrado, created_at, ebooks(titulo)')
    .eq('alumno_id', user.id)
    .order('created_at', { ascending: false })

  const compras = (ordenes ?? []).map((o) => ({
    id: o.id,
    estado: o.estado,
    precio: formatoARS.format(o.precio_cobrado / 100),
    fecha: new Date(o.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    titulo: (o.ebooks as any)?.titulo ?? 'Ebook',
  }))

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Mis compras</h1>
        <p className="text-muted-foreground mt-2 font-sans">Los ebooks que compraste, para volver a descargarlos cuando quieras.</p>
      </div>

      {compras.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-4" />
          Todavía no tenés compras asociadas a esta cuenta.
        </div>
      ) : (
        <ComprasClient compras={compras} />
      )}
    </div>
  )
}
