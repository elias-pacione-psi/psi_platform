import type { ReactNode } from 'react'
import { existeEnR2, firmarUrlR2, r2Configurado } from '@/utils/r2'

const CARPETA = 'Biblioteca R2/Videos/Videos Main Principal/'

// Firmar es cálculo local y no confirma que el archivo exista: sin el existeEnR2 una key
// movida o borrada dejaría un <video> roto en una página pública. Si algo falla devuelve
// null y el hero cae al `fallback` (la ilustración de siempre).
async function firmarVideo(key: string): Promise<string | null> {
  if (!r2Configurado()) return null
  try {
    if (!(await existeEnR2(key))) return null
    return await firmarUrlR2(key)
  } catch (err) {
    console.error(`No se pudo firmar el video ${key}:`, err instanceof Error ? err.message : err)
    return null
  }
}

type Props = {
  /** Nombre del archivo dentro de «Biblioteca R2/Videos/Videos Main Principal/». */
  archivo: string
  poster: string
  etiqueta: string
  fallback: ReactNode
}

export async function VideoHero({ archivo, poster, etiqueta, fallback }: Props) {
  const url = await firmarVideo(`${CARPETA}${archivo}`)
  if (!url) return <>{fallback}</>

  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-card">
      <video
        src={`${url}#t=0.001`}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className="block aspect-video w-full bg-tinta object-cover"
      />
      <figcaption className="border-t border-border px-4 py-2.5 font-sans text-sm text-tinta/75">
        {etiqueta}
      </figcaption>
    </figure>
  )
}
