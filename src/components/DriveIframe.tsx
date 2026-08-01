'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Maximize, Minimize } from 'lucide-react'
import { Button } from './ui/button'
import { esPaginaDePreviewSandboxeable } from '@/lib/utils'

interface DriveIframeProps {
  url: string;
}

export function DriveIframe({ url }: DriveIframeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const getEmbedUrl = (rawUrl: string) => {
    try {
      if (rawUrl.includes('/view')) {
        return rawUrl.replace(/\/view(\?.*)?$/, '/preview')
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  const embedUrl = getEmbedUrl(url)
  const esPreview = esPaginaDePreviewSandboxeable(url)

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="text-tinta border-border hover:bg-muted font-semibold"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
          {isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
        </Button>
      </div>

      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-muted shadow-inner ${isFullscreen ? 'h-screen' : 'rounded-xl border border-border'}`}
        style={!isFullscreen ? { paddingTop: '56.25%' } : {}}
      >
        {/* Sandbox SOLO para páginas de preview en HTML (Drive/Dropbox): sin
            allow-same-origin ahí, el visor queda en un spinner infinito (verificado
            con un PDF público real). Un archivo directo (dl.dropboxusercontent.com,
            o un futuro pub-*.r2.dev de Cloudflare R2) en cambio se apoya en el visor
            nativo del navegador, que el sandbox bloquea por completo: el iframe queda
            en blanco y la petición ni sale a la red. El riesgo del sandbox permisivo
            se acota del lado del servidor: errorEnRecurso() en
            src/app/psicologo/actions.ts solo permite guardar URLs https de hosts
            conocidos (drive.google.com, dropbox.com) para estos tipos. */}
        <iframe
          src={embedUrl}
          className={`absolute top-0 left-0 w-full h-full border-0 z-0 ${isFullscreen ? 'mt-0' : ''}`}
          allow="autoplay; fullscreen"
          sandbox={esPreview ? 'allow-scripts allow-same-origin allow-forms' : undefined}
          title="Contenido del material"
        />
        {/* Escudo invisible para bloquear el botón emergente nativo de Drive/Dropbox;
            un archivo directo no tiene ese botón. */}
        {esPreview && <div className="absolute top-0 right-0 w-[60px] h-[60px] bg-transparent z-10 cursor-default" />}

        {isFullscreen && (
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            // Fijo claro (no tokens de tema): flota sobre el documento de Drive, que
            // es blanco sin importar el tema de la app.
            className="absolute top-4 left-4 z-20 bg-nieve/80 hover:bg-nieve text-noche shadow-md backdrop-blur-sm"
          >
            <Minimize className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
