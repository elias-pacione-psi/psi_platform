'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'

type Modo = 'nativa' | 'css' | null

/**
 * Pantalla completa que también funciona en iPhone.
 *
 * Los tres visores del portal (biblioteca, PDF seguro, iframe de Drive) llamaban
 * `contenedor.requestFullscreen()` sobre un `<div>`. En iOS eso no existe: la Fullscreen
 * API de elementos no está implementada en WebKit móvil — sólo `<video>` puede ir a
 * pantalla completa. Así que `requestFullscreen` era `undefined` y la llamada tiraba un
 * TypeError **sincrónico**, que el `.catch()` encadenado no podía atrapar (no llega a
 * devolver una promesa que rechazar). El botón quedaba muerto, sin ningún error visible.
 * Es lo que reportó una alumna probando desde el celular.
 *
 * Cuando la API nativa no está —o el navegador la rechaza— se cae a una pantalla completa
 * por CSS: el contenedor pasa a `fixed inset-0`. No es idéntica (la barra del navegador
 * sigue ahí) pero da el mismo resultado práctico, que es leer el material sin el resto de
 * la página alrededor. El componente que use el hook aplica esas clases cuando `porCss`.
 */
export function usePantallaCompleta(ref: RefObject<HTMLElement | null>) {
  const [modo, setModo] = useState<Modo>(null)

  // Salir con Escape o con el botón del propio navegador no pasa por `alternar`, así que
  // el estado se sincroniza escuchando el evento en vez de tocarlo sólo en el toggle.
  useEffect(() => {
    const alCambiar = () => {
      if (!document.fullscreenElement) setModo((m) => (m === 'nativa' ? null : m))
    }
    document.addEventListener('fullscreenchange', alCambiar)
    return () => document.removeEventListener('fullscreenchange', alCambiar)
  }, [])

  // En modo CSS no hay navegador que escuche Escape por nosotros.
  useEffect(() => {
    if (modo !== 'css') return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModo(null)
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [modo])

  // Con el contenedor fijo tapando el viewport, la página de atrás seguiría scrolleando
  // bajo el dedo — que es justo lo que se siente roto en un teléfono.
  useEffect(() => {
    if (modo !== 'css') return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = anterior
    }
  }, [modo])

  const alternar = useCallback(() => {
    if (modo) {
      if (modo === 'nativa' && document.fullscreenElement) void document.exitFullscreen()
      setModo(null)
      return
    }

    const el = ref.current
    if (!el) return

    // `fullscreenEnabled` además de la existencia del método: da false dentro de un
    // iframe sin allow="fullscreen", donde el método existe pero siempre rechaza.
    if (typeof el.requestFullscreen === 'function' && document.fullscreenEnabled) {
      try {
        const promesa = el.requestFullscreen()
        setModo('nativa')
        // Si el navegador la rechaza igual (permisos, gesto no confiable), no dejamos al
        // usuario sin nada: cae al modo CSS.
        if (promesa && typeof promesa.catch === 'function') promesa.catch(() => setModo('css'))
      } catch {
        setModo('css')
      }
    } else {
      setModo('css')
    }
  }, [modo, ref])

  return {
    /** Está en pantalla completa, por cualquiera de los dos caminos. */
    activa: modo !== null,
    /** Hay que aplicar las clases de pantalla completa por CSS (no la maneja el navegador). */
    porCss: modo === 'css',
    alternar,
  }
}

/** Clases del contenedor cuando la pantalla completa la sostenemos nosotros por CSS. */
export const CLASES_PANTALLA_COMPLETA_CSS = 'fixed inset-0 z-[60] w-screen h-screen max-h-screen rounded-none border-0'
