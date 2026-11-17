import { Headphones } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { resolverUrlRecurso, firmarDescargaR2, extraerKeyDeR2 } from '@/utils/r2'
import { SiteHeader } from '@/components/SiteHeader'
import { ReproductorPodcast, type EpisodioConAudio } from './ReproductorPodcast'

export const metadata = {
  title: 'Podcast | Elias Pacione',
  description: 'Conversaciones sobre emociones, vínculos y espiritualidad. Gratuito y abierto a todo el público.',
}

// Página pública, sin guard de sesión: el podcast es material gratuito. Igual que en
// /ebooks, las policies ya limitan a anon a los episodios publicados, pero se filtra
// explícito para no depender en silencio de que la policy no cambie (un psicólogo
// logueado sí vería los borradores sin este filtro).
//
// Se renderiza en cada visita (lee cookies vía createClient): el audio vive en R2
// privado y la URL firmada vence, así que no conviene que quede cacheada.
export default async function PodcastPage() {
  const supabase = await createClient()
  const { data: episodios, error } = await supabase
    .from('podcast_episodios')
    .select('id, numero, titulo, descripcion, audio_key, duracion_segundos, publicado_en')
    .eq('estado', 'publicado')
    .order('numero', { ascending: false })

  if (error) console.error('Error cargando episodios del podcast:', error.message)

  const conAudio: EpisodioConAudio[] = (
    await Promise.all(
      (episodios ?? []).map(async ({ audio_key, ...e }) => {
        const key = extraerKeyDeR2(audio_key)
        const audioUrl = await resolverUrlRecurso(audio_key)
        if (!key || !audioUrl) return null
        const extension = key.split('.').pop() ?? 'mp3'
        // Nombre ASCII: viaja en el header Content-Disposition, donde una tilde no siempre
        // llega entera a todos los navegadores.
        const nombre = `Episodio ${e.numero} - ${e.titulo}`.normalize('NFD').replace(/[^\x20-\x7e]/g, '')
        const descargaUrl = await firmarDescargaR2(key, `${nombre}.${extension}`).catch(() => null)
        return { ...e, audioUrl, descargaUrl }
      }),
    )
  ).filter((e) => e !== null)

  return (
    <main className="min-h-screen bg-crema font-sans">
      <SiteHeader />

      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-16">
        <p className="font-sans text-xs font-semibold tracking-[0.14em] uppercase text-marca mb-4 text-center">
          Podcast · Gratuito
        </p>
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-tinta mb-4 tracking-tight text-center">
          Psicología con sentido
        </h1>
        <p className="text-tinta/70 max-w-xl mx-auto mb-12 font-serif text-center leading-relaxed">
          Conversaciones breves sobre emociones, vínculos y espiritualidad. Abierto a todo
          el público: escuchalo acá, sin registrarte.
        </p>

        {conAudio.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
            <Headphones className="w-10 h-10 mx-auto mb-4" />
            Muy pronto, el primer episodio.
          </div>
        ) : (
          <ReproductorPodcast episodios={conAudio} />
        )}
      </div>
    </main>
  )
}
