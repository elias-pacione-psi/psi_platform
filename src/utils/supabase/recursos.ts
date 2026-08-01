import { createAdminClient } from '@/utils/supabase/admin'
import { extraerKeyDeR2, firmarUrlR2 } from '@/utils/r2'

// Solo servidor: firma URLs de buckets privados con el cliente service-role.
// Llamar SIEMPRE después de obtener las filas con el cliente del usuario
// (RLS ya garantizó que puede verlas).

export const BUCKET_MATERIALES = 'materiales'
export const BUCKET_ENTREGAS = 'entregas'
const EXPIRACION_SEGUNDOS = 60 * 60 // 1 hora

type RecursoConUrl = { tipo_contenido: string; url_recurso: string }

// Reemplaza url_recurso por una URL firmada en los recursos subidos, sea al bucket
// 'materiales' de Supabase (supabase_*, alternativa) o a Cloudflare R2 (marca r2key://,
// el default para material nuevo — ver utils/r2-marcador.ts). Los tipos externos
// (drive_*/dropbox_* con URL real, enlace, texto) quedan igual.
export async function firmarUrlsRecursos<T extends RecursoConUrl>(items: T[]): Promise<T[]> {
  const aFirmarSupabase = items.filter(
    (i) => i.tipo_contenido.startsWith('supabase_') && !i.url_recurso.startsWith('http')
  )

  const firmadasSupabase = aFirmarSupabase.length > 0
    ? await firmarPaths(BUCKET_MATERIALES, [...new Set(aFirmarSupabase.map((i) => i.url_recurso))])
    : new Map<string, string>()

  return Promise.all(
    items.map(async (i) => {
      const keyR2 = extraerKeyDeR2(i.url_recurso)
      if (keyR2) {
        try {
          return { ...i, url_recurso: await firmarUrlR2(keyR2) }
        } catch (err) {
          console.error('No se pudo firmar la URL de R2:', err instanceof Error ? err.message : err)
          return i
        }
      }
      const firmadaSupabase = firmadasSupabase.get(i.url_recurso)
      return firmadaSupabase ? { ...i, url_recurso: firmadaSupabase } : i
    })
  )
}

// Firma un único archivo de entrega (path guardado en entregas.archivo_url).
// Las entregas nuevas van a R2 (marca r2key://, único destino posible); las viejas
// quedan en el bucket privado 'entregas' de Supabase.
export async function firmarUrlEntrega(path: string | null | undefined): Promise<string | null> {
  if (!path) return null

  const keyR2 = extraerKeyDeR2(path)
  if (keyR2) {
    try {
      return await firmarUrlR2(keyR2)
    } catch (err) {
      console.error('No se pudo firmar la entrega de R2:', err instanceof Error ? err.message : err)
      return null
    }
  }

  const firmadas = await firmarPaths(BUCKET_ENTREGAS, [path])
  return firmadas.get(path) ?? null
}

async function firmarPaths(bucket: string, paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (paths.length === 0) return out
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrls(paths, EXPIRACION_SEGUNDOS)
  if (error || !data) {
    console.error(`Error firmando URLs de ${bucket}:`, error?.message)
    return out
  }
  data.forEach((d) => {
    if (d.path && d.signedUrl) out.set(d.path, d.signedUrl)
  })
  return out
}
