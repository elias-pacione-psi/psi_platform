'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Maximize, Minimize } from 'lucide-react'
import { Button } from './ui/button'

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

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="text-tinta border-gray-300 hover:bg-gray-100 font-semibold"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
          {isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
        </Button>
      </div>

      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden bg-gray-100 shadow-inner ${isFullscreen ? 'h-screen' : 'rounded-xl border border-gray-200'}`}
        style={!isFullscreen ? { paddingTop: '56.25%' } : {}}
      >
        <iframe
          src={embedUrl}
          className={`absolute top-0 left-0 w-full h-full border-0 z-0 ${isFullscreen ? 'mt-0' : ''}`}
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="Contenido del material"
        />
        {/* Escudo invisible para bloquear el clic al botón emergente nativo de Google Drive */}
        <div className="absolute top-0 right-0 w-[60px] h-[60px] bg-transparent z-10 cursor-default" />

        {isFullscreen && (
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 z-20 bg-white/80 hover:bg-white text-tinta shadow-md backdrop-blur-sm"
          >
            <Minimize className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
