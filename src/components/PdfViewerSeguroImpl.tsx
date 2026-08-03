'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2, ZoomIn, ZoomOut, ShieldAlert } from 'lucide-react'
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
  const [paginaVisible, setPaginaVisible] = useState(1)
  const [error, setError] = useState(false)
  const [pageWidth, setPageWidth] = useState(0)
  const [escala, setEscala] = useState(1)
  const pageAreaRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const el = pageAreaRef.current
    if (!el) return
    const update = () => setPageWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Todas las páginas quedan montadas en el mismo contenedor con scroll continuo (en
  // vez de una por vez con botones) — este observer solo actualiza el indicador
  // "Página X de Y" según qué página está más visible, no controla qué se renderiza.
  useEffect(() => {
    const root = pageAreaRef.current
    if (!root || !numPages) return
    const observer = new IntersectionObserver(
      (entries) => {
        const masVisible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (masVisible) {
          const pagina = Number((masVisible.target as HTMLElement).dataset.pagina)
          if (pagina) setPaginaVisible(pagina)
        }
      },
      { root, threshold: [0.25, 0.5, 0.75] }
    )
    Object.values(pageRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [numPages, pageWidth, escala])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPaginaVisible(1)
    setError(false)
    pageRefs.current = {}
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
  const anchoPagina = Math.max(anchoBase, 200) * escala

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground font-medium">
          {numPages ? `Página ${paginaVisible} de ${numPages}` : 'Cargando...'}
        </span>
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
          {pageWidth > 0 && numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(n => (
            <div key={n} data-pagina={n} ref={el => { pageRefs.current[n] = el }}>
              <Page
                pageNumber={n}
                width={anchoPagina}
                className="my-4 shadow-sm"
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  )
}
