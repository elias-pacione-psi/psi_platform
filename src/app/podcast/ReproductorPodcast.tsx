'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, RotateCw, SkipForward, Volume2, VolumeX, Download, ChevronDown, Mic } from 'lucide-react'
import { formatearDuracion, formatearFechaEpisodio, type EpisodioPodcast } from '@/utils/podcast'

export type EpisodioConAudio = EpisodioPodcast & { audioUrl: string; descargaUrl: string | null }

const VELOCIDADES = [1, 1.25, 1.5, 2]

// Un solo <audio> para todos los episodios: cambiar de capítulo cambia el src. Los
// controles son propios (los nativos se ven distinto en cada navegador y no combinan con
// la marca), pero el estado sale siempre del elemento real vía sus eventos, nunca de un
// contador paralelo que se pueda desincronizar.
export function ReproductorPodcast({ episodios }: { episodios: EpisodioConAudio[] }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [actualId, setActualId] = useState(episodios[0].id)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [tiempo, setTiempo] = useState(0)
  const [duracion, setDuracion] = useState(episodios[0].duracion_segundos ?? 0)
  const [velocidad, setVelocidad] = useState(1)
  const [volumen, setVolumen] = useState(1)
  const [silenciado, setSilenciado] = useState(false)
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())
  // Al cambiar de episodio desde la lista, recién se puede dar play cuando el src nuevo
  // ya está puesto en el elemento — o sea, después del render.
  const reproducirAlCargar = useRef(false)

  const indice = episodios.findIndex((e) => e.id === actualId)
  const actual = episodios[indice]
  const siguiente = episodios[indice + 1] ?? null

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    // Cambiar el src vuelve playbackRate al default: se fijan los dos.
    audio.defaultPlaybackRate = velocidad
    audio.playbackRate = velocidad
    if (reproducirAlCargar.current) {
      reproducirAlCargar.current = false
      audio.play().catch(() => setReproduciendo(false))
    }
  }, [actualId, velocidad])

  // Controles de la pantalla bloqueada / auriculares en el celular.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: actual.titulo,
      artist: 'Elias Pacione',
      album: 'Psicología con sentido',
    })
  }, [actual])

  function elegir(id: string) {
    const audio = audioRef.current
    if (!audio) return
    if (id === actualId) {
      if (audio.paused) audio.play().catch(() => setReproduciendo(false))
      else audio.pause()
      return
    }
    const ep = episodios.find((e) => e.id === id)
    setTiempo(0)
    setDuracion(ep?.duracion_segundos ?? 0)
    reproducirAlCargar.current = true
    setActualId(id)
  }

  function saltar(segundos: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + segundos), audio.duration || Infinity)
  }

  function cambiarVolumen(valor: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = valor
    audio.muted = valor === 0
  }

  function alternarDetalle(id: string) {
    setAbiertos((prev) => {
      const nuevo = new Set(prev)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
  }

  const progreso = duracion > 0 ? Math.min(100, (tiempo / duracion) * 100) : 0
  const botonControl = 'p-2 rounded-full text-nieve/80 hover:text-nieve hover:bg-nieve/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="space-y-10">
      <audio
        ref={audioRef}
        src={actual.audioUrl}
        preload="metadata"
        onPlay={() => setReproduciendo(true)}
        onPause={() => setReproduciendo(false)}
        onTimeUpdate={(e) => setTiempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration)) setDuracion(e.currentTarget.duration)
        }}
        onVolumeChange={(e) => {
          setVolumen(e.currentTarget.volume)
          setSilenciado(e.currentTarget.muted)
        }}
        onEnded={() => (siguiente ? elegir(siguiente.id) : setReproduciendo(false))}
      />

      {/* REPRODUCTOR — bg-noche fijo (no bg-tinta) para que sea la misma placa oscura en
          los dos temas, como el footer. */}
      <section aria-label="Reproductor" className="bg-noche text-nieve rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[112px_minmax(0,1fr)] gap-5 sm:gap-6 items-center">
        <div className="hidden sm:flex w-28 h-28 rounded-xl bg-marca items-center justify-center">
          <Mic className="w-12 h-12 text-nieve" aria-hidden />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-nieve/60">Episodio {actual.numero}</p>
          <p className="font-heading text-lg sm:text-xl font-semibold line-clamp-2 mb-3">{actual.titulo}</p>

          <input
            type="range"
            min={0}
            max={duracion || 0}
            step={1}
            value={Math.min(tiempo, duracion || 0)}
            onChange={(e) => {
              if (audioRef.current) audioRef.current.currentTime = Number(e.target.value)
            }}
            aria-label="Posición del episodio"
            className="w-full h-1.5 cursor-pointer accent-nieve"
            style={{ background: `linear-gradient(to right, #f7f6f3 ${progreso}%, rgb(247 246 243 / 0.2) ${progreso}%)` }}
          />
          <div className="flex justify-between text-xs text-nieve/60 mt-1 tabular-nums">
            <span>{formatearDuracion(tiempo)}</span>
            <span>{duracion ? formatearDuracion(duracion) : '--:--'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-3">
            <button type="button" onClick={() => saltar(-15)} className={botonControl} aria-label="Retroceder 15 segundos" title="-15 s">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => elegir(actual.id)}
              className="w-12 h-12 rounded-full bg-nieve text-noche flex items-center justify-center hover:bg-nieve/90 transition-colors"
              aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
            >
              {reproduciendo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button type="button" onClick={() => saltar(30)} className={botonControl} aria-label="Avanzar 30 segundos" title="+30 s">
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => siguiente && elegir(siguiente.id)}
              disabled={!siguiente}
              className={botonControl}
              aria-label="Episodio siguiente"
              title="Siguiente"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  const v = VELOCIDADES[(VELOCIDADES.indexOf(velocidad) + 1) % VELOCIDADES.length]
                  setVelocidad(v)
                }}
                className="text-xs font-medium tabular-nums border border-nieve/40 rounded-md px-2 py-1 text-nieve/85 hover:bg-nieve/10 transition-colors min-w-[3rem]"
                aria-label={`Velocidad ${velocidad}x, cambiar`}
              >
                {velocidad}x
              </button>
              <button
                type="button"
                onClick={() => cambiarVolumen(silenciado || volumen === 0 ? 1 : 0)}
                className={botonControl}
                aria-label={silenciado ? 'Activar sonido' : 'Silenciar'}
              >
                {silenciado || volumen === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={silenciado ? 0 : volumen}
                onChange={(e) => cambiarVolumen(Number(e.target.value))}
                aria-label="Volumen"
                className="hidden md:block w-20 h-1 cursor-pointer accent-nieve"
              />
              {actual.descargaUrl && (
                <a href={actual.descargaUrl} className={botonControl} aria-label="Descargar episodio" title="Descargar">
                  <Download className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CAPÍTULOS */}
      <section aria-labelledby="titulo-capitulos">
        <h2 id="titulo-capitulos" className="font-heading font-semibold text-tinta text-xl mb-2">Capítulos</h2>
        <ul>
          {episodios.map((e) => {
            const esActual = e.id === actualId
            const abierto = abiertos.has(e.id)
            return (
              <li key={e.id} className="border-t border-border last:border-b">
                <div className="flex items-center gap-3 sm:gap-4 py-4">
                  <button
                    type="button"
                    onClick={() => elegir(e.id)}
                    className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                      esActual ? 'bg-tinta text-crema border-tinta' : 'border-tinta/25 text-tinta hover:border-marca hover:text-marca'
                    }`}
                    aria-label={esActual && reproduciendo ? `Pausar ${e.titulo}` : `Reproducir ${e.titulo}`}
                  >
                    {esActual && reproduciendo ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => alternarDetalle(e.id)}
                    aria-expanded={abierto}
                    aria-controls={`detalle-${e.id}`}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left group"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs text-muted-foreground">
                        Episodio {e.numero} · {formatearFechaEpisodio(e.publicado_en)}
                      </span>
                      <span className={`block font-medium line-clamp-2 ${esActual ? 'text-marca' : 'text-tinta'} group-hover:text-marca transition-colors`}>
                        {e.titulo}
                      </span>
                    </span>
                    {e.duracion_segundos && (
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {formatearDuracion(e.duracion_segundos)}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {abierto && (
                  <div id={`detalle-${e.id}`} className="pl-[3.25rem] sm:pl-14 pb-5 -mt-1">
                    <p className="font-serif text-sm text-tinta/75 leading-relaxed whitespace-pre-line">
                      {e.descripcion || 'Este episodio todavía no tiene descripción.'}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
