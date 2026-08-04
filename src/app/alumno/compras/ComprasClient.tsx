'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { descargarEbookDeOrden } from '@/app/ebooks/actions'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type Compra = { id: string; estado: string; precio: string; fecha: string; titulo: string }

const LABEL_ESTADO: Record<string, string> = {
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  fallida: 'No se acreditó',
  reembolsada: 'Reembolsada',
}

export function ComprasClient({ compras }: { compras: Compra[] }) {
  const [isPending, startTransition] = useTransition()

  function handleDescargar(ordenId: string) {
    startTransition(async () => {
      const res = await descargarEbookDeOrden(ordenId)
      if ('error' in res) { toast.error(res.error); return }
      window.location.href = res.url
    })
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
      {compras.map((c) => (
        <div key={c.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-tinta">{c.titulo}</p>
            <p className="text-sm text-muted-foreground">{c.fecha} · {c.precio}</p>
          </div>
          {c.estado === 'pagada' ? (
            <Button
              size="sm" onClick={() => handleDescargar(c.id)} disabled={isPending}
              className="bg-marca hover:bg-marca/90 text-crema"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Descargar
            </Button>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
              {LABEL_ESTADO[c.estado] ?? c.estado}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
