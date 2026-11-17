'use server'

import { revalidatePath } from 'next/cache'
import { requirePsicologo } from '@/utils/supabase/guards'
import { esMarcadorR2, keyDeMarcadorR2, extensionDe, PREFIJO_ENTREGAS_R2 } from '@/utils/r2-marcador'
import { EXTENSIONES_AUDIO_PODCAST } from '@/utils/podcast'

// Como en ebooks: la policy podcast_all_psicologo ya le da al psicólogo acceso total a la
// tabla, así que alcanza con el cliente del usuario — no hace falta createAdminClient().

const DURACION_MAXIMA_SEGUNDOS = 6 * 60 * 60

export async function guardarEpisodio(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = (formData.get('id') as string) || null
  const numero = Number(formData.get('numero'))
  const titulo = (formData.get('titulo') as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null
  const audio = (formData.get('audio_key') as string)?.trim() || ''
  const duracionRaw = (formData.get('duracion_segundos') as string)?.trim()
  const publicadoEn = (formData.get('publicado_en') as string)?.trim()
  const estado = formData.get('estado') === 'publicado' ? 'publicado' : 'borrador'

  if (!Number.isInteger(numero) || numero <= 0 || numero > 10_000) return { error: 'Ingresá un número de episodio válido' }
  if (!titulo) return { error: 'El título es obligatorio' }
  if (titulo.length > 150) return { error: 'El título es demasiado largo' }
  if (descripcion && descripcion.length > 3000) return { error: 'La descripción es demasiado larga' }
  if (!publicadoEn || !/^\d{4}-\d{2}-\d{2}$/.test(publicadoEn)) return { error: 'Ingresá la fecha del episodio' }

  // Solo audios del bucket: un link de Drive/Dropbox no se reproduce en un <audio>.
  if (!audio || !esMarcadorR2(audio)) return { error: 'Elegí el audio desde Disco Duro' }
  // La página es pública y firma lo que diga esta columna: que nunca apunte a la carpeta
  // de entregas de alumnos, aunque el archivo tenga extensión de audio.
  if (keyDeMarcadorR2(audio)?.startsWith(PREFIJO_ENTREGAS_R2)) return { error: 'Ese archivo no se puede publicar' }
  if (!EXTENSIONES_AUDIO_PODCAST.includes(extensionDe(audio))) {
    return { error: `El audio tiene que ser ${EXTENSIONES_AUDIO_PODCAST.join(', ')}` }
  }

  let duracion_segundos: number | null = null
  if (duracionRaw) {
    duracion_segundos = Math.round(Number(duracionRaw))
    if (!Number.isFinite(duracion_segundos) || duracion_segundos <= 0 || duracion_segundos > DURACION_MAXIMA_SEGUNDOS) {
      return { error: 'La duración no es válida' }
    }
  }

  let choque = supabase.from('podcast_episodios').select('id').eq('numero', numero)
  if (id) choque = choque.neq('id', id)
  const { data: yaExiste } = await choque.maybeSingle()
  if (yaExiste) return { error: `Ya hay un episodio con el número ${numero}` }

  const campos = { numero, titulo, descripcion, audio_key: audio, duracion_segundos, publicado_en: publicadoEn, estado }

  const { error } = id
    ? await supabase.from('podcast_episodios').update(campos).eq('id', id)
    : await supabase.from('podcast_episodios').insert(campos)
  if (error) {
    console.error('Error guardando episodio del podcast:', error.message)
    return { error: 'No se pudo guardar el episodio. Intentá de nuevo.' }
  }

  revalidatePath('/psicologo/podcast')
  revalidatePath('/podcast')
  return { success: true }
}

export async function eliminarEpisodio(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase.from('podcast_episodios').delete().eq('id', id)
  if (error) {
    console.error('Error eliminando episodio del podcast:', error.message)
    return { error: 'No se pudo eliminar el episodio.' }
  }

  revalidatePath('/psicologo/podcast')
  revalidatePath('/podcast')
  return { success: true }
}
