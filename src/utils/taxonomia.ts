import 'server-only'
import { extraerKeyDeR2 } from './r2'

// Misma lógica que el backfill de supabase/schema.sql (sección 6), pero para cuando se
// crea o edita una fila: así tipo_medio/origen no dependen de que alguien vuelva a
// correr un backfill manual cada vez que se agrega material nuevo.

export function tipoMedioPorTipoContenido(tipoContenido: string): string | null {
  if (tipoContenido.endsWith('_video')) return 'video'
  if (tipoContenido.endsWith('_audio')) return 'audio'
  if (tipoContenido.endsWith('_pdf')) return 'pdf'
  if (tipoContenido === 'drive_image') return 'imagen'
  if (tipoContenido === 'texto_markdown') return 'markdown'
  if (tipoContenido === 'quiz') return 'quiz'
  if (tipoContenido === 'entrega') return 'entrega'
  if (tipoContenido === 'enlace_externo') return 'enlace'
  return null
}

// origen se deriva de la URL real, no de tipo_contenido: es la misma razón que en el
// backfill SQL — confiar en el prefijo perpetuaría el mismo tipo de mislabeling que ya
// se encontró en datos reales (16 lecciones sembradas como 'r2_pdf' con url_recurso
// vacío). extraerKeyDeR2() es la única fuente de verdad para "esto es de R2" en toda la
// app, así que se reusa en vez de duplicar el chequeo con otro regex.
export function origenPorUrlRecurso(urlRecurso: string | null, tipoContenido: string): string | null {
  if (!urlRecurso) return null
  if (extraerKeyDeR2(urlRecurso)) return 'r2'
  if (urlRecurso.includes('supabase.co/storage/')) return 'supabase'
  if (urlRecurso.includes('drive.google.com') || urlRecurso.includes('docs.google.com')) return 'drive'
  if (urlRecurso.includes('dropbox.com')) return 'dropbox'
  if (tipoContenido.startsWith('supabase_')) return 'supabase'
  if (tipoContenido === 'enlace_externo') return 'externo'
  return null
}
