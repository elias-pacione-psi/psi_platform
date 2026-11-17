// Lo comparten la página pública /podcast, su reproductor y el panel del psicólogo.
// Sin `server-only`: el reproductor y el formulario de carga corren en el navegador.

export type EpisodioPodcast = {
  id: string
  numero: number
  titulo: string
  descripcion: string | null
  duracion_segundos: number | null
  publicado_en: string
}

// Formatos que <audio> reproduce en todos los navegadores actuales. wav queda afuera a
// propósito: pesa diez veces más que un mp3 y en datos móviles no arranca nunca.
export const EXTENSIONES_AUDIO_PODCAST = ['mp3', 'm4a', 'aac', 'ogg', 'oga', 'opus']

// 125 -> "02:05", 3725 -> "1:02:05".
export function formatearDuracion(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mmss = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

// "2026-11-09" -> "9 nov 2026". La fecha es un `date` sin hora: se arma en UTC para que la
// zona del navegador no la corra un día para atrás.
export function formatearFechaEpisodio(fecha: string): string {
  // formatToParts y no toLocaleDateString: en es-AR este último intercala "de" ("9 de nov
  // de 2026"), que en una línea de metadatos sobra.
  const partes = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .formatToParts(new Date(`${fecha}T00:00:00Z`))
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value.replace('.', '') ?? ''
  return `${parte('day')} ${parte('month')} ${parte('year')}`
}
