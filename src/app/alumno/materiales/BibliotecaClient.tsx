"use client";

import { useState } from "react";
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, FileText, FileAudio, FileVideo, FileImage, ExternalLink, X, Maximize, Minimize } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRef, useEffect } from 'react'
import { esPaginaDePreviewSandboxeable } from '@/lib/utils'
import { PdfViewerSeguro } from '@/components/PdfViewerSeguro'

type Recurso = { id: string, titulo: string, tipo_contenido: string, url_recurso: string }

export function BibliotecaClient({ recursos }: { recursos: Recurso[] }) {
  const [selectedRecurso, setSelectedRecurso] = useState<Recurso | null>(null)

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

  const getIcon = (tipo: string) => {
    if (tipo.includes('video')) return <FileVideo className="w-5 h-5 text-marca" />;
    if (tipo.includes('audio')) return <FileAudio className="w-5 h-5 text-marca" />;
    if (tipo.includes('pdf')) return <FileText className="w-5 h-5 text-marca" />;
    if (tipo.includes('imagen') || tipo.includes('image')) return <FileImage className="w-5 h-5 text-marca" />;
    return <ExternalLink className="w-5 h-5 text-marca" />;
  }

  const videos = recursos.filter(l => l.tipo_contenido.includes('video'))
  const audios = recursos.filter(l => l.tipo_contenido.includes('audio'))
  const documentos = recursos.filter(l => l.tipo_contenido.includes('pdf'))
  const extras = recursos.filter(l => !l.tipo_contenido.includes('video') && !l.tipo_contenido.includes('audio') && !l.tipo_contenido.includes('pdf'))

  const renderRecursosList = (list: Recurso[]) => {
    if (list.length === 0) return <p className="text-center text-muted-foreground py-8">No hay materiales en esta categoría.</p>
    return (
      <div className="grid gap-3">
        {list.map((material) => {
          return (
            <Card
              key={material.id}
              onClick={() => setSelectedRecurso(material)}
              className="border-border hover:border-marca/50 hover:shadow-md hover:bg-muted transition-all duration-200 cursor-pointer group"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-crema group-hover:bg-marca/10">
                    {getIcon(material.tipo_contenido)}
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-base transition-colors text-tinta group-hover:text-marca">
                      {material.titulo}
                    </h3>
                  </div>
                </div>
                <Button variant="ghost" className="text-marca opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Abrir
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6">
        <Tabs defaultValue="documentos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="documentos">Lecturas (PDF)</TabsTrigger>
            <TabsTrigger value="audios">Audios</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="extras">Otros recursos</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="mt-0">{renderRecursosList(documentos)}</TabsContent>
          <TabsContent value="audios" className="mt-0">{renderRecursosList(audios)}</TabsContent>
          <TabsContent value="videos" className="mt-0">{renderRecursosList(videos)}</TabsContent>
          <TabsContent value="extras" className="mt-0">{renderRecursosList(extras)}</TabsContent>
        </Tabs>
      </div>

      {selectedRecurso && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col backdrop-blur-sm">
          <div className="flex justify-between items-center p-4 bg-noche text-white shrink-0">
            <div className="flex items-center gap-3">
              {getIcon(selectedRecurso.tipo_contenido)}
              <h2 className="font-heading font-bold text-xl">{selectedRecurso.titulo}</h2>
            </div>
            <Button variant="ghost" onClick={() => setSelectedRecurso(null)} className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 bg-muted relative p-4 md:p-8">
            {selectedRecurso.tipo_contenido === 'enlace_externo' ? (
              <div className="h-full flex flex-col items-center justify-center bg-card rounded-xl shadow-lg border border-border p-8">
                <ExternalLink className="w-16 h-16 text-marca mb-4" />
                <h3 className="text-2xl font-bold text-tinta mb-2">Enlace externo</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Este recurso se abrirá en una nueva pestaña fuera de la plataforma.
                </p>
                <a href={selectedRecurso.url_recurso} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-marca hover:bg-marca/90 text-crema font-bold h-12 px-8 rounded-full text-lg">
                    Ir al recurso
                  </Button>
                </a>
              </div>
            ) : selectedRecurso.tipo_contenido.includes('pdf') && !esPaginaDePreviewSandboxeable(selectedRecurso.url_recurso) ? (
              /* Mismo visor que la sección Programa (react-pdf): sin botón de descarga
                 ni impresión, sin capa de texto seleccionable y clic derecho bloqueado.
                 Antes acá había un iframe al archivo firmado y el visor nativo del
                 navegador exponía ambos botones en su toolbar. El viewer ya trae su
                 propia barra (página, zoom, pantalla completa), así que no lleva el
                 contenedor con borde ni el botón externo de fullscreen. */
              <div className="h-full w-full max-w-6xl mx-auto overflow-auto">
                <PdfViewerSeguro url={selectedRecurso.url_recurso} />
              </div>
            ) : (
              <div className="h-full w-full max-w-6xl mx-auto flex flex-col gap-3">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-tinta border-border bg-card hover:bg-muted font-semibold shadow-sm"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
                    {isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  </Button>
                </div>

                <div
                  ref={containerRef}
                  className={`relative w-full overflow-hidden bg-card shadow-2xl border border-border ${isFullscreen ? 'h-screen rounded-none border-none' : 'h-full rounded-xl'}`}
                >
                  {/* Escudo anti-popouts de Drive */}
                  <div className="absolute top-0 right-0 w-[60px] h-[60px] bg-transparent z-50 cursor-default" />

                  {isFullscreen && (
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={toggleFullscreen}
                      // Fijo claro (no tokens de tema): flota sobre el visor de Drive/PDF,
                      // que es blanco sin importar el tema de la app.
                      className="absolute top-4 left-4 z-50 bg-nieve/80 hover:bg-nieve text-noche shadow-md backdrop-blur-sm"
                    >
                      <Minimize className="w-5 h-5" />
                    </Button>
                  )}

                  {selectedRecurso.tipo_contenido === 'r2_video' || selectedRecurso.tipo_contenido === 'supabase_video' ? (
                    <video src={selectedRecurso.url_recurso} controls className="w-full h-full object-contain bg-black relative z-0" />
                  ) : selectedRecurso.tipo_contenido === 'r2_audio' || selectedRecurso.tipo_contenido === 'supabase_audio' ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted p-8 relative z-0">
                      <audio src={selectedRecurso.url_recurso} controls className="w-full max-w-2xl" />
                    </div>
                  ) : selectedRecurso.tipo_contenido === 'r2_imagen' ? (
                    /* Imagen del bucket (carpeta "Biblioteca R2/Otros"): <img> directo y no
                       iframe — el iframe genérico de más abajo asume una página de preview
                       de Drive/Dropbox, no un archivo propio. */
                    <div className="w-full h-full flex items-center justify-center bg-muted p-4 relative z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedRecurso.url_recurso}
                        alt={selectedRecurso.titulo}
                        className="max-w-full max-h-full object-contain select-none"
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </div>
                  ) : (
                    /* Sandbox SOLO para páginas de preview en HTML (Drive/Dropbox): sin
                       allow-same-origin ahí, el visor queda en spinner infinito (verificado
                       con un PDF público). Un archivo directo (dl.dropboxusercontent.com,
                       o un futuro pub-*.r2.dev de R2) se apoya en el visor nativo del
                       navegador, que el sandbox bloquea (iframe en blanco). El riesgo del
                       sandbox permisivo se acota server-side: errorEnRecurso() en
                       psicologo/actions.ts solo permite https de hosts conocidos para
                       estos tipos. */
                    <iframe
                      src={selectedRecurso.url_recurso.replace('/view', '/preview')}
                      className="w-full h-full border-0 z-0 relative bg-card"
                      allow="autoplay; fullscreen"
                      sandbox={esPaginaDePreviewSandboxeable(selectedRecurso.url_recurso) ? 'allow-scripts allow-same-origin allow-forms' : undefined}
                      title="Visor de material"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
