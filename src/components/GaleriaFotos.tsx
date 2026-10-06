'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { AlbumGaleria } from '@/utils/galeria-quien-soy'

// Grilla pareja (4:3 recortado) y no una mampostería: no se conocen las medidas de cada
// foto de antemano, y con alturas libres las columnas se reacomodan a medida que cargan.
// El recorte es sólo de la miniatura — el visor muestra la foto entera.
//
// Nada de next/image, mismo motivo que IlustracionSitio: la URL viene firmada y cambia
// cada hora, así que el optimizador nunca acertaría el caché. `loading="lazy"` hace de
// contrapeso para que una galería larga no baje todas las fotos de una.
export function GaleriaFotos({ albumes }: { albumes: AlbumGaleria[] }) {
  const fotos = albumes.flatMap((a) => a.fotos.map((f) => ({ ...f, album: a.titulo })))
  const [abierta, setAbierta] = useState<number | null>(null)

  // Índice global de la primera foto de cada álbum, para que el visor recorra todo en orden.
  const inicios = albumes.map((_, a) => albumes.slice(0, a).reduce((n, x) => n + x.fotos.length, 0))

  const actual = abierta === null ? null : fotos[abierta]
  const mover = (delta: number) =>
    setAbierta((i) => (i === null ? i : (i + delta + fotos.length) % fotos.length))

  return (
    <>
      <div className="space-y-12">
        {albumes.map((album, a) => (
          <div key={album.titulo ?? '__sueltas'}>
            {album.titulo && (
              <h3 className="font-heading font-semibold text-tinta text-lg tracking-tight mb-4">
                {album.titulo}
              </h3>
            )}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {album.fotos.map((foto, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setAbierta(inicios[a] + i)}
                    className="group block w-full overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt={foto.alt}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover object-[center_30%] transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Dialog open={abierta !== null} onOpenChange={(abrir) => !abrir && setAbierta(null)}>
        <DialogContent
          className="sm:max-w-5xl gap-3 bg-card p-3 sm:p-4"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') mover(-1)
            else if (e.key === 'ArrowRight') mover(1)
          }}
        >
          {actual && (
            <>
              {/* Mismo texto que el pie visible: base-ui exige título y descripción para
                  nombrar el diálogo, pero acá ya hay un pie, así que van sólo para lectores
                  de pantalla. */}
              <DialogTitle className="sr-only">{actual.album ?? 'Galería'}</DialogTitle>
              <DialogDescription className="sr-only">{actual.alt}</DialogDescription>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={actual.url}
                alt={actual.alt}
                className="mx-auto block max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />

              <div className="flex items-center justify-between gap-3">
                <p className="font-serif text-sm text-tinta/75 min-w-0">
                  {actual.pie ?? actual.album ?? ''}
                </p>
                {fotos.length > 1 && (
                  <div className="flex shrink-0 items-center gap-1 font-sans text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => mover(-1)}
                      aria-label="Foto anterior"
                      className="rounded-full p-2 text-tinta transition-colors hover:bg-gris-calido/60"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span aria-live="polite">
                      {(abierta ?? 0) + 1} / {fotos.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => mover(1)}
                      aria-label="Foto siguiente"
                      className="rounded-full p-2 text-tinta transition-colors hover:bg-gris-calido/60"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
