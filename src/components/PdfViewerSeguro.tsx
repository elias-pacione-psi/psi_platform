'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from './ui/button'
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist'

// Visor propio en <canvas> (pdfjs-dist) en vez de <iframe src={url}>: un iframe a la
// URL del PDF deja que el navegador use su visor nativo, que trae su propia barra con
// Descargar/Imprimir que no se puede ocultar desde la página (es UI del navegador, no
// del DOM). Renderizando página por página como imagen no queda ese botón, no hay capa
// de texto para seleccionar/copiar, y se bloquea el clic derecho. No es a prueba de
// balas (alguien puede sacar una captura de pantalla, como con cualquier contenido que
// llega a mostrarse en una pantalla), pero saca el atajo de un clic.
export function PdfViewerSeguro({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const docRef = useRef<PDFDocumentProxy | null>(null)
  const taskRef = useRef<PDFDocumentLoadingTask | null>(null)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [escala, setEscala] = useState(1.2)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    setTotalPaginas(0)
    setPagina(1)

    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString()

        const task = pdfjs.getDocument({ url })
        taskRef.current = task
        const doc = await task.promise
        if (cancelado) { task.destroy(); return }
        docRef.current = doc
        setTotalPaginas(doc.numPages)
      } catch {
        if (!cancelado) setError('No se pudo cargar el documento.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    })()

    return () => {
      cancelado = true
      taskRef.current?.destroy()
      taskRef.current = null
      docRef.current = null
    }
  }, [url])

  useEffect(() => {
    const doc = docRef.current
    if (!doc || cargando || error) return
    let cancelado = false

    ;(async () => {
      const page = await doc.getPage(pagina)
      if (cancelado) return
      const viewport = page.getViewport({ scale: escala })
      const canvas = canvasRef.current
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: context, viewport, canvas }).promise
    })()

    return () => { cancelado = true }
  }, [pagina, escala, cargando, error, totalPaginas])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={cargando || !!error || pagina <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground font-medium min-w-[110px] text-center">
            {cargando ? 'Cargando...' : error ? '—' : `Página ${pagina} de ${totalPaginas}`}
          </span>
          <Button variant="outline" size="icon" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={cargando || !!error || pagina >= totalPaginas}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setEscala(s => Math.max(0.6, +(s - 0.2).toFixed(1)))} disabled={cargando || !!error}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setEscala(s => Math.min(2.4, +(s + 0.2).toFixed(1)))} disabled={cargando || !!error}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        className="w-full overflow-auto bg-muted rounded-xl border border-border flex justify-center p-4 select-none"
        style={{ maxHeight: '80vh' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {error ? (
          <div className="py-24 flex flex-col items-center gap-2 text-muted-foreground">
            <ShieldAlert className="w-6 h-6" />
            <p className="text-sm">{error}</p>
          </div>
        ) : cargando ? (
          <div className="py-24 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-sm rounded-lg max-w-full h-auto" />
        )}
      </div>
    </div>
  )
}
