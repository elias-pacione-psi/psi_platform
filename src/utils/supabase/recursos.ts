import { createAdminClient } from '@/utils/supabase/admin'

// Solo servidor: firma URLs del bucket privado 'materiales' con el cliente
// service-role. Llamar SIEMPRE después de haber obtenido las filas con el
// cliente del usuario (RLS ya garantizó que puede verlas).

export const BUCKET_MATERIALES = 'materiales'
const EXPIRACION_SEGUNDOS = 60 * 60 // 1 hora

export function esArchivoSubido(tipo_contenido: string) {
  return tipo_contenido.startsWith('supabase_')
}

type RecursoConUrl = { tipo_contenido: string; url_recurso: string }

// Reemplaza url_recurso por una URL firmada en los recursos subidos al bucket.
// Los tipos externos (drive_*, dropbox_*, enlace, texto) quedan igual.
export async function firmarUrlsRecursos<T extends RecursoConUrl>(items: T[]): Promise<T[]> {
  const aFirmar = items.filter(
    (i) => esArchivoSubido(i.tipo_contenido) && !i.url_recurso.startsWith('http')
  )
  if (aFirmar.length === 0) return items

  const paths = [...new Set(aFirmar.map((i) => i.url_recurso))]
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_MATERIALES)
    .createSignedUrls(paths, EXPIRACION_SEGUNDOS)

  if (error || !data) {
    console.error('Error firmando URLs de materiales:', error?.message)
    return items
  }

  const firmadas = new Map<string, string>()
  data.forEach((d) => {
    if (d.path && d.signedUrl) firmadas.set(d.path, d.signedUrl)
  })

  return items.map((i) => {
    const firmada = firmadas.get(i.url_recurso)
    return firmada ? { ...i, url_recurso: firmada } : i
  })
}
