'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Worker propio (mismo origen que la app): no depende de un CDN de terceros.
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
}

// Sin renderTextLayer/renderAnnotationLayer: react-pdf normalmente superpone una capa
// de texto seleccionable y de anotaciones/links sobre el <canvas> de cada página. Acá
// se apagan a propósito — no queremos texto copiable ni links que faciliten sacar el
// archivo. Tampoco hay un link directo a `url` en el estado de error (a diferencia del
// mismo componente en Think_Like_a_Native) por la misma razón: eso sería una descarga
// directa. Clic derecho bloqueado. Nada de esto es a prueba de balas (una captura de
// pantalla siempre es posible, como con cualquier contenido que se muestra en una
// pantalla), pero saca el atajo de un clic.
export default function PdfViewerSeguroImpl({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState(false)
  const [pageWidth, setPageWidth] = useState(0)
  const [escala, setEscala] = useState(1)
  const pageAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = pageAreaRef.current
    if (!el) return
    const update = () => setPageWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
    setError(false)
  }, [])

  const onDocumentLoadError = useCallback(() => {
    setError(true)
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 bg-muted border border-border rounded-xl min-h-[400px] p-8 text-center text-muted-foreground">
        <ShieldAlert className="w-6 h-6" />
        <p className="text-sm">No se pudo cargar el documento.</p>
      </div>
    )
  }

  const anchoBase = Math.min(pageWidth - 16, 900)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={!numPages || pageNumber <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground font-medium min-w-[110px] text-center">
            {numPages ? `Página ${pageNumber} de ${numPages}` : 'Cargando...'}
          </span>
          <Button variant="outline" size="icon" onClick={() => setPageNumber(p => Math.min(numPages ?? p, p + 1))} disabled={!numPages || pageNumber >= numPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setEscala(s => Math.max(0.6, +(s - 0.2).toFixed(1)))} disabled={!numPages}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setEscala(s => Math.min(2, +(s + 0.2).toFixed(1)))} disabled={!numPages}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        ref={pageAreaRef}
        className="w-full overflow-auto flex flex-col items-center bg-muted rounded-xl border border-border select-none"
        style={{ maxHeight: '80vh' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          {pageWidth > 0 && (
            <Page
              pageNumber={pageNumber}
              width={Math.max(anchoBase, 200) * escala}
              className="my-4 shadow-sm"
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          )}
        </Document>
      </div>
    </div>
  )
}
