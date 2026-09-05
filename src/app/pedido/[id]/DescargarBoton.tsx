'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { descargarEbookDeOrden } from '@/app/ebooks/actions'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DescargarBoton({ ordenId }: { ordenId: string }) {
  const [isPending, startTransition] = useTransition()
  const [descargado, setDescargado] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const autoIniciadoRef = useRef(false)

  const iniciarDescarga = useCallback(() => {
    startTransition(async () => {
      const res = await descargarEbookDeOrden(ordenId)
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      // La descarga se dispara apuntando un iframe oculto a la URL firmada, no con
      // window.location.href. La URL viene con Content-Disposition: attachment, así que
      // en el camino feliz las dos hacen lo mismo — pero si la firma venció o R2 responde
      // un error, ESE response no trae el header de attachment: con location.href el
      // navegador se va de la página del pedido a un XML de error de S3 y la persona
      // pierde el link de su compra. Dentro del iframe, el error queda ahí adentro
      // (invisible) y la página sigue en pie con el botón para reintentar.
      if (iframeRef.current) iframeRef.current.src = res.url
      else window.location.href = res.url
      setDescargado(true)
    })
  }, [ordenId])

  // La descarga arranca sola al llegar acá con el pedido ya pagado — que es a lo que
  // vuelve la persona desde Mercado Pago. El ref (y no el state) es lo que garantiza una
  // sola ejecución: en desarrollo React monta el efecto dos veces a propósito.
  useEffect(() => {
    if (autoIniciadoRef.current) return
    autoIniciadoRef.current = true
    iniciarDescarga()
  }, [iniciarDescarga])

  return (
    <div className="space-y-3">
      <Button
        onClick={iniciarDescarga}
        disabled={isPending}
        className="w-full bg-marca hover:bg-marca/90 text-crema font-bold h-14 rounded-xl text-lg shadow-sm"
      >
        {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
        {isPending ? 'Preparando la descarga…' : descargado ? 'Volver a descargar' : 'Descargar mi ebook'}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        {isPending
          ? 'Preparando tu descarga…'
          : descargado
            ? 'Tu descarga ya arrancó. Si el archivo no se guardó, volvé a apretar el botón.'
            : 'Si la descarga no arranca sola, apretá el botón.'}
      </p>
      {/* No es para mostrar nada: es el destino de la descarga (ver iniciarDescarga). */}
      <iframe ref={iframeRef} title="Descarga del ebook" aria-hidden="true" className="hidden" />
    </div>
  )
}
