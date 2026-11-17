import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PodcastAdminClient } from './PodcastAdminClient'

export const metadata = { title: 'Podcast | Elias Pacione' }

export default async function PodcastAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'psicologo') redirect('/alumno')

  const { data: episodios, error } = await supabase
    .from('podcast_episodios')
    .select('id, numero, titulo, descripcion, audio_key, duracion_segundos, estado, publicado_en')
    .order('numero', { ascending: false })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Podcast</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Episodios gratuitos que se escuchan en /podcast sin cuenta. El audio se sube primero
          a Disco Duro y acá se elige.
        </p>
      </div>

      {error ? (
        // Lo más probable es que todavía no se haya corrido el snippet
        // supabase/snippets/2026-11-17-podcast-episodios.sql en producción.
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900 text-red-700 dark:text-red-400 rounded-2xl p-6 font-sans space-y-2">
          <p className="font-bold">No se pudieron cargar los episodios.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : (
        <PodcastAdminClient episodios={episodios ?? []} />
      )}
    </div>
  )
}
