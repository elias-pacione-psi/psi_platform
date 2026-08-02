'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// react-pdf/pdfjs-dist toca APIs de navegador (DOMMatrix) a nivel de módulo: aunque
// PdfViewerSeguroImpl ya es 'use client', Next.js igual evalúa ese módulo al armar el
// bundle de servidor (RSC/SSR) y explota con "DOMMatrix is not defined". ssr:false lo
// saca por completo del bundle de servidor — no se puede usar dynamic(...,{ssr:false})
// directo en un Server Component, por eso este wrapper (client) es el que se importa
// desde la página de lección (server). Mismo patrón que Think_Like_a_Native.
const PdfViewerSeguroImpl = dynamic(() => import('./PdfViewerSeguroImpl'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-muted rounded-xl border border-border">
      <Loader2 className="w-8 h-8 text-marca animate-spin mb-4" />
      <p className="text-muted-foreground font-sans">Cargando documento...</p>
    </div>
  ),
})

export function PdfViewerSeguro({ url }: { url: string }) {
  return <PdfViewerSeguroImpl url={url} />
}
