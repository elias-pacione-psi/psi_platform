'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { descargarEbookDeOrden } from '@/app/ebooks/actions'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DescargarBoton({ ordenId }: { ordenId: string }) {
  const [isPending, startTransition] = useTransition()
  const [descargado, setDescargado] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const res = await descargarEbookDeOrden(ordenId)
      if ('error' in res) { toast.error(res.error); return }
      // Navegación directa y no <a href>: la URL se firma recién al clickear, así que
      // no hay un href fijo para poner de antemano — se pide en el momento y se abre.
      window.location.href = res.url
      setDescargado(true)
    })
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isPending} className="w-full bg-marca hover:bg-marca/90 text-crema font-bold h-14 rounded-xl text-lg">
        {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
        Descargar mi ebook
      </Button>
      {descargado && (
        <p className="text-sm text-muted-foreground text-center">
          Si la descarga no arrancó sola, volvé a apretar el botón.
        </p>
      )}
    </div>
  )
}
