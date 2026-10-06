import 'server-only'
import { BUCKET_ENTREGAS } from '@/utils/supabase/recursos'
import { borrarDeR2, extraerKeyDeR2, listarKeysRecursivo, r2Configurado } from '@/utils/r2'
import { PREFIJO_ENTREGAS_R2 } from '@/utils/r2-marcador'

// Baja de una persona: sus datos, su perfil y su cuenta de Auth.
//
// Vive acá y no en una server action por el mismo motivo que invitaciones.ts: la usan
// "Eliminar definitivamente" y "Restaurar credenciales", y exportarla desde un archivo
// 'use server' la volvería un endpoint RPC que borra cuentas por id desde el navegador.
// Acá es una función de servidor: solo la llama código que ya pasó por requirePsicologo().

// Todo lo que cuelga de la persona por alumno_id. En el schema las FK ya son
// `on delete cascade`, pero se borra explícito igual: así una tabla creada a mano sin el
// cascade no frena la baja, y un fallo puntual queda en el log en vez de abortar todo.
const TABLAS_DEL_USUARIO = [
  'programas_asignados',
  'recursos_asignados',
  'agenda_sesiones',
  'cohortes_alumnos',
  'progreso_lecciones',
  'quiz_intentos',
  'entregas',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

/**
 * Borra las filas de la persona, su perfil y su usuario de Auth. Con eso su email queda
 * libre para volver a invitarlo. No toca archivos: para eso, borrarArchivosDeEntregas().
 */
export async function borrarCuentaYDatos(supabaseAdmin: SupabaseAdmin, id: string): Promise<{ error: string } | { ok: true }> {
  for (const tabla of TABLAS_DEL_USUARIO) {
    const { error } = await supabaseAdmin.from(tabla).delete().eq('alumno_id', id)
    if (error) console.error(`Error borrando ${tabla} del alumno (se continúa):`, error.message)
  }

  await supabaseAdmin.from('alumnos').delete().eq('id', id)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) return { error: authError.message }

  return { ok: true }
}

/**
 * Borra los archivos que la persona subió como entrega de trabajos, en R2 y en el bucket
 * viejo de Supabase. Tiene que correr ANTES de borrar la cuenta: las keys salen de
 * entregas.archivo_url, y una vez borradas esas filas no queda forma de saber qué
 * archivos eran suyos.
 *
 * Además de las keys de las filas se lista la carpeta de la persona (entregas/{id}/ en R2,
 * {id}/ en Supabase): una entrega que se reenvía reemplaza la fila, y el archivo anterior
 * queda huérfano en el bucket sin que ninguna fila lo nombre.
 *
 * Borrar un objeto que ya no existe no falla en R2 ni en Supabase, así que si algo corta a
 * mitad se puede volver a correr sin problema.
 */
export async function borrarArchivosDeEntregas(supabaseAdmin: SupabaseAdmin, id: string): Promise<{ error: string } | { ok: true }> {
  const { data: filas, error: errorFilas } = await supabaseAdmin
    .from('entregas')
    .select('archivo_url')
    .eq('alumno_id', id)
  if (errorFilas) return { error: errorFilas.message }

  const keysR2 = new Set<string>()
  const pathsSupabase = new Set<string>()
  for (const { archivo_url } of (filas ?? []) as { archivo_url: string | null }[]) {
    if (!archivo_url) continue
    const key = extraerKeyDeR2(archivo_url)
    if (key) keysR2.add(key)
    else pathsSupabase.add(archivo_url)
  }

  if (r2Configurado()) {
    try {
      for (const key of await listarKeysRecursivo(`${PREFIJO_ENTREGAS_R2}${id}/`)) keysR2.add(key)
    } catch (err) {
      return { error: `No se pudo revisar el almacenamiento: ${err instanceof Error ? err.message : err}` }
    }
  } else if (keysR2.size > 0) {
    return { error: 'El almacenamiento no está configurado: no se pueden borrar los archivos entregados.' }
  }

  if (keysR2.size > 0) {
    try {
      await borrarDeR2([...keysR2])
    } catch (err) {
      return { error: `No se pudieron borrar los archivos entregados: ${err instanceof Error ? err.message : err}` }
    }
  }

  // Bucket viejo de Supabase: las entregas de antes de R2 viven en {id}/…
  const { data: enCarpeta } = await supabaseAdmin.storage.from(BUCKET_ENTREGAS).list(id, { limit: 1000 })
  for (const objeto of (enCarpeta ?? []) as { name: string }[]) pathsSupabase.add(`${id}/${objeto.name}`)

  if (pathsSupabase.size > 0) {
    const { error } = await supabaseAdmin.storage.from(BUCKET_ENTREGAS).remove([...pathsSupabase])
    if (error) return { error: `No se pudieron borrar los archivos entregados: ${error.message}` }
  }

  return { ok: true }
}
