'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FotoCarrusel = { src: string; alt: string }

const INTERVALO_MS = 6000

// Las fotos se publican recortadas a 4:5 (960×1200): el aspecto fijo evita que la altura
// salte entre diapositivas y reserva el lugar antes de que cargue la imagen.
const ANCHO = 960
const ALTO = 1200

const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Pista con scroll-snap nativo: el deslizar con el dedo, la rueda y el trackpad funcionan
// sin código, y las flechas y los puntos sólo reposicionan el scroll. Cada diapositiva mide
// exactamente el ancho de la pista, así que la foto i empieza en i × clientWidth.
// El ancho lo decide quien lo usa (ver FotoElias y las grillas de las dos páginas); con
// fotos de 960 px nítidas hasta ~480 px de ancho en pantallas de doble densidad.
//
// Avanza sola cada INTERVALO_MS, salvo con "reducir movimiento" activado, y se detiene
// mientras el puntero o el foco están encima (WCAG 2.2.2). Al llegar a la última vuelve a
// la primera de golpe, en vez de rebobinar recorriendo las otras nueve.
//
// Sin next/image, igual que FotoElias antes: son archivos de public/ ya optimizados y
// recortados, el optimizador no aportaría nada. Sólo la primera carga de entrada; el
// resto, `loading="lazy"`, se baja a medida que el scroll se acerca.
export function CarruselFotos({ fotos, etiqueta, className }: { fotos: FotoCarrusel[]; etiqueta: string; className?: string }) {
  const pista = useRef<HTMLUListElement>(null)
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)

  const irA = (indice: number, suave = true) => {
    const el = pista.current
    if (!el) return
    el.scrollTo({ left: indice * el.clientWidth, behavior: suave && !sinMovimiento() ? 'smooth' : 'auto' })
  }

  const mover = (delta: number) => {
    const siguiente = (actual + delta + fotos.length) % fotos.length
    irA(siguiente, Math.abs(siguiente - actual) === 1)
  }

  useEffect(() => {
    if (pausado || fotos.length < 2 || sinMovimiento()) return

    const id = setInterval(() => {
      const el = pista.current
      if (!el) return
      const siguiente = (Math.round(el.scrollLeft / el.clientWidth) + 1) % fotos.length
      el.scrollTo({ left: siguiente * el.clientWidth, behavior: siguiente === 0 ? 'auto' : 'smooth' })
    }, INTERVALO_MS)

    return () => clearInterval(id)
  }, [pausado, fotos.length])

  if (fotos.length === 0) return null

  return (
    <section
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div className="relative">
        <ul
          ref={pista}
          onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {fotos.map((foto, i) => (
            <li
              key={foto.src}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${fotos.length}`}
              className="w-full shrink-0 snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.src}
                alt={foto.alt}
                width={ANCHO}
                height={ALTO}
                loading={i === 0 ? undefined : 'lazy'}
                decoding="async"
                className="block aspect-[4/5] w-full object-cover"
              />
            </li>
          ))}
        </ul>

        {fotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => mover(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-crema/85 text-tinta shadow-sm transition-colors hover:bg-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-crema/85 text-tinta shadow-sm transition-colors hover:bg-crema focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="flex items-center justify-center border-t border-border px-3 py-1">
          {fotos.map((foto, i) => (
            <button
              key={foto.src}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ir a la foto ${i + 1}`}
              aria-current={i === actual}
              className="group flex h-6 w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-marca"
            >
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === actual ? 'w-4 bg-marca' : 'w-1.5 bg-tinta/25 group-hover:bg-tinta/50',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
