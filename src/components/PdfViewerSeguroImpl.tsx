'use client'

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Loader2, ZoomIn, ZoomOut, ShieldAlert, Maximize, Minimize } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Worker propio (mismo origen que la app): no depende de un CDN de terceros.
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
}

const ESCALA_MIN = 0.6
// Hasta 4x (antes 2x): en un teléfono la página arranca ajustada al ancho de pantalla,
// así que 2x seguía siendo letra chica para un PDF con cuerpo de texto normal.
const ESCALA_MAX = 4
const ESCALA_PASO = 0.2
const ESCALA_DOBLE_TOQUE = 2.5

const limitarEscala = (valor: number) =>
  +Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, valor)).toFixed(2)

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
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const pageAreaRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // --- Gestos táctiles (pinza y doble toque) ---------------------------------
  // Solo se activan con pointerType 'touch': con mouse/trackpad el visor se comporta
  // exactamente igual que antes.
  const punterosRef = useRef(new Map<number, { x: number; y: number }>())
  const pinzaRef = useRef<{ distancia: number; escala: number } | null>(null)
  const huboPinzaRef = useRef(false)
  const ultimoToqueRef = useRef<{ t: number; x: number; y: number } | null>(null)
  // Punto del documento que estaba bajo los dedos al hacer zoom, en fracción del alto
  // y ancho totales. Se reaplica al scroll después del re-render para que el zoom no
  // "salte" al principio de la página.
  const anclaRef = useRef<{ fx: number; fy: number; cx: number; cy: number } | null>(null)

  // El estado no se toca a mano en el toggle: se escucha el evento, así que salir con
  // Escape (que no pasa por el botón) también deja el componente en sync.
  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  const togglePantallaCompleta = () => {
    if (!document.fullscreenElement) {
      contenedorRef.current?.requestFullscreen().catch((err) => {
        console.error('No se pudo entrar en pantalla completa:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

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

  // Reposiciona el scroll para que el punto anclado siga bajo el dedo. Corre en dos
  // tiempos porque react-pdf redibuja el canvas de cada página de forma asíncrona: la
  // primera pasada acomoda con las medidas del layout nuevo y el rAF corrige una vez
  // que las páginas ya tomaron su tamaño final.
  useLayoutEffect(() => {
    const el = pageAreaRef.current
    const ancla = anclaRef.current
    if (!el || !ancla) return
    anclaRef.current = null
    const aplicar = () => {
      el.scrollLeft = ancla.fx * el.scrollWidth - ancla.cx
      el.scrollTop = ancla.fy * el.scrollHeight - ancla.cy
    }
    aplicar()
    const id = requestAnimationFrame(aplicar)
    return () => cancelAnimationFrame(id)
  }, [escala])

  // Guarda como ancla el punto del documento que hay bajo (x, y) en coordenadas de
  // pantalla, para conservarlo al cambiar la escala.
  const anclarEn = useCallback((x: number, y: number) => {
    const el = pageAreaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = x - rect.left
    const cy = y - rect.top
    anclaRef.current = {
      fx: (el.scrollLeft + cx) / Math.max(el.scrollWidth, 1),
      fy: (el.scrollTop + cy) / Math.max(el.scrollHeight, 1),
      cx,
      cy,
    }
  }, [])

  // Los botones de zoom anclan al centro del área visible, que es lo que el usuario
  // está mirando; sin esto, acercar desde un botón te manda al borde del documento.
  const cambiarEscala = useCallback((siguiente: (previa: number) => number) => {
    const el = pageAreaRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      anclarEn(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
    setEscala(previa => limitarEscala(siguiente(previa)))
  }, [anclarEn])

  const alBajarPuntero = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    punterosRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (punterosRef.current.size === 2) {
      const [a, b] = [...punterosRef.current.values()]
      pinzaRef.current = { distancia: Math.hypot(a.x - b.x, a.y - b.y), escala }
    }
  }

  const alMoverPuntero = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    const punteros = punterosRef.current
    if (!punteros.has(e.pointerId)) return
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pinza = pinzaRef.current
    if (punteros.size !== 2 || !pinza || !pinza.distancia) return
    const [a, b] = [...punteros.values()]
    const distancia = Math.hypot(a.x - b.x, a.y - b.y)
    const nueva = limitarEscala(pinza.escala * (distancia / pinza.distancia))
    huboPinzaRef.current = true
    if (nueva === escala) return
    anclarEn((a.x + b.x) / 2, (a.y + b.y) / 2)
    setEscala(nueva)
  }

  const alSoltarPuntero = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return
    // Doble toque para acercar/alejar. Solo cuenta si fue un dedo solo y no venimos de
    // una pinza: al levantar el segundo dedo de una pinza también llega un pointerup.
    if (punterosRef.current.size === 1 && !huboPinzaRef.current) {
      const ahora = Date.now()
      const previo = ultimoToqueRef.current
      if (previo && ahora - previo.t < 300 && Math.hypot(e.clientX - previo.x, e.clientY - previo.y) < 30) {
        anclarEn(e.clientX, e.clientY)
        setEscala(previa => (previa > 1 ? 1 : ESCALA_DOBLE_TOQUE))
        ultimoToqueRef.current = null
      } else {
        ultimoToqueRef.current = { t: ahora, x: e.clientX, y: e.clientY }
      }
    }
    punterosRef.current.delete(e.pointerId)
    if (punterosRef.current.size < 2) pinzaRef.current = null
    if (punterosRef.current.size === 0) huboPinzaRef.current = false
  }

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
    // El contenedor de pantalla completa incluye la barra de herramientas, no solo las
    // páginas: si no, el zoom y el indicador de página desaparecen justo cuando el
    // documento se ve más grande.
    <div
      ref={contenedorRef}
      className={`space-y-3 ${pantallaCompleta ? 'h-screen bg-crema p-4 flex flex-col' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <span className="text-sm text-muted-foreground font-medium">
          {numPages ? `Página ${paginaVisible} de ${numPages}` : 'Cargando...'}
        </span>
        <div className="flex items-center gap-2">
          {/* Solo aparece con el zoom cambiado, así la barra en escritorio se ve igual
              que siempre mientras el documento está en su tamaño natural. */}
          {escala !== 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cambiarEscala(() => 1)}
              className="h-10 sm:h-7 font-semibold tabular-nums"
              title="Restablecer zoom"
            >
              {Math.round(escala * 100)}%
            </Button>
          )}
          {/* size-10 en teléfono: 32px es un blanco de toque incómodo con el dedo.
              Desde sm queda en size-8, idéntico a como estaba. */}
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-8"
            onClick={() => cambiarEscala(s => s - ESCALA_PASO)}
            disabled={!numPages || escala <= ESCALA_MIN}
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-8"
            onClick={() => cambiarEscala(s => s + ESCALA_PASO)}
            disabled={!numPages || escala >= ESCALA_MAX}
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={togglePantallaCompleta} className="h-10 sm:h-7 font-semibold">
            {pantallaCompleta ? <Minimize className="w-4 h-4 sm:mr-2" /> : <Maximize className="w-4 h-4 sm:mr-2" />}
            <span className="hidden sm:inline">
              {pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
            </span>
          </Button>
        </div>
      </div>

      <div
        ref={pageAreaRef}
        // touch-action pan-x pan-y: deja el arrastre con un dedo al navegador (scroll
        // normal) pero nos reserva la pinza, que acá re-renderiza el PDF a mayor escala
        // en vez de estirar el bitmap — el texto queda nítido, no pixelado.
        className={`w-full overflow-auto bg-muted rounded-xl border border-border select-none ${pantallaCompleta ? 'flex-1 min-h-0' : 'max-h-[78dvh] md:max-h-[80vh]'}`}
        style={{ touchAction: 'pan-x pan-y' }}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={alBajarPuntero}
        onPointerMove={alMoverPuntero}
        onPointerUp={alSoltarPuntero}
        onPointerCancel={alSoltarPuntero}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          // w-fit + min-w-full: con `items-center` a secas, una página más ancha que el
          // contenedor se desborda por los dos lados y el scroll no llega nunca al borde
          // izquierdo — o sea, justo al acercar se perdía el principio de cada renglón.
          // Así el envoltorio mide lo que mide el contenido y el scroll lo recorre entero.
          className="w-fit min-w-full flex flex-col items-center"
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
