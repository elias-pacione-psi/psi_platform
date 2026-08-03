'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePsicologo } from '@/utils/supabase/guards'
import { createAdminClient } from '@/utils/supabase/admin'
import { BUCKET_MATERIALES } from '@/utils/supabase/recursos'
import { borrarDeR2, extraerKeyDeR2 } from '@/utils/r2'
import { esMarcadorR2 } from '@/utils/r2-marcador'
import { tipoMedioPorTipoContenido, origenPorUrlRecurso } from '@/utils/taxonomia'
import { fechasDeClases, horarioCompleto, duracionMinutos, instanteArgentina, MAXIMO_CLASES } from '@/utils/horario-cohorte'

// URL base para los redirects de invitación (localhost en dev, VERCEL_URL/SITE_URL en prod)
function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

// Los invitados deben pasar por /configurar-password antes de entrar al portal
const INVITE_REDIRECT = `${baseUrl()}/auth/confirm?next=/configurar-password`

// Borra del backend que corresponda los archivos subidos (ignora URLs externas).
// R2 se detecta por la marca r2key:// (extraerKeyDeR2), no por tipo_contenido: el mismo
// tipo_contenido (ej. drive_video) puede vivir en Drive real o en R2 elegido por el picker.
async function limpiarArchivosDeStorage(recursos: { tipo_contenido: string; url_recurso: string }[]) {
  const subidos = recursos.filter(r => r.url_recurso && !r.url_recurso.startsWith('http'))

  const pathsR2 = subidos.map(r => extraerKeyDeR2(r.url_recurso)).filter((k): k is string => Boolean(k))
  const pathsSupabase = subidos.filter(r => r.tipo_contenido.startsWith('supabase_')).map(r => r.url_recurso)

  if (pathsR2.length > 0) await borrarDeR2(pathsR2)

  if (pathsSupabase.length > 0) {
    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin.storage.from(BUCKET_MATERIALES).remove(pathsSupabase)
    if (error) console.error('Error limpiando Storage de Supabase (se continúa):', error.message)
  }
}

// ============================================================
// VALIDACIÓN DE CONTENIDO
// url_recurso y link_videollamada terminan embebidos en <iframe>, <video>,
// <audio>, <img> y window.open(): nunca aceptar protocolos que no sean https
// ni hosts fuera del proveedor que declara tipo_contenido.
// ============================================================

// 'quiz' y 'entrega' no llevan recurso embebido (quiz: preguntas aparte;
// entrega: consigna en markdown opcional). tipo_contenido sigue siendo solo el FORMATO
// (cómo renderizar); el origen real del archivo (R2/Drive/Dropbox/Supabase) vive en la
// columna `origen` y no en el nombre del tipo — ver utils/taxonomia.ts. Subir a R2 se
// hace desde /psicologo/archivos (el gestor) y después se elige acá con el picker
// (marca r2key://, ver utils/r2-marcador.ts), en vez de subir de nuevo por cada lección.
const TIPOS_LECCION = [
  'drive_video', 'drive_audio', 'drive_pdf', 'drive_image',
  'dropbox_video', 'dropbox_audio', 'dropbox_pdf',
  'supabase_video', 'supabase_audio', 'supabase_pdf',
  'texto_markdown', 'quiz', 'entrega',
] as const

const TIPOS_BIBLIOTECA = [
  'drive_pdf', 'drive_video', 'drive_audio',
  'dropbox_pdf', 'dropbox_video', 'dropbox_audio',
  'supabase_pdf', 'supabase_video', 'supabase_audio',
  'enlace_externo',
] as const

const HOSTS_DRIVE = ['drive.google.com']
const HOSTS_DROPBOX = ['www.dropbox.com', 'dropbox.com', 'dl.dropboxusercontent.com']

// Path dentro de un bucket (tipos supabase_*): sin esquema ni traversal
const RE_PATH_BUCKET = /^[a-zA-Z0-9][a-zA-Z0-9_\-./]*$/

function esUrlHttps(valor: string, hosts?: string[]): boolean {
  let url: URL
  try { url = new URL(valor) } catch { return false }
  if (url.protocol !== 'https:') return false
  return !hosts || hosts.includes(url.hostname)
}

// Devuelve un mensaje de error, o null si url_recurso es válido para ese tipo
function errorEnRecurso(tipo_contenido: string, url_recurso: string): string | null {
  if (tipo_contenido === 'quiz') return null // sin recurso
  if (tipo_contenido === 'entrega' || tipo_contenido === 'texto_markdown') {
    return url_recurso.length <= 50000 ? null : 'El texto es demasiado largo (máx. 50.000 caracteres)'
  }
  if (!url_recurso) return 'El recurso es obligatorio'
  // Elegido desde el picker/gestor de archivos de R2: ya se validó ahí (allowlist de
  // Content-Type + requirePsicologo), acá solo hace falta reconocer la marca y su largo.
  if (esMarcadorR2(url_recurso)) return url_recurso.length <= 600 ? null : 'Referencia de archivo inválida'
  if (tipo_contenido.startsWith('supabase_')) {
    const esPathValido = RE_PATH_BUCKET.test(url_recurso) && !url_recurso.includes('..') && url_recurso.length <= 500
    return esPathValido ? null : 'Ruta de archivo inválida'
  }
  if (url_recurso.length > 2000) return 'La URL es demasiado larga'
  if (tipo_contenido.startsWith('drive_') && tipo_contenido !== 'drive_image') {
    return esUrlHttps(url_recurso, HOSTS_DRIVE) ? null : 'La URL debe ser https de drive.google.com'
  }
  if (tipo_contenido.startsWith('dropbox_')) {
    return esUrlHttps(url_recurso, HOSTS_DROPBOX) ? null : 'La URL debe ser https de dropbox.com'
  }
  // drive_image admite cualquier imagen https; enlace_externo, cualquier https
  return esUrlHttps(url_recurso) ? null : 'La URL debe empezar con https://'
}

// ============================================================
// ALUMNOS
// ============================================================

const alumnoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no es válido').max(254),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  link_videollamada: z.string().trim().max(500)
    .refine(v => v === '' || esUrlHttps(v), 'El link de videollamada debe ser una URL https válida')
    .optional().or(z.literal('')),
})

// Invita por email y deja el perfil creado con rol 'alumno'. Sale de crearAlumnoDirecto
// para que aprobar una solicitud del formulario público haga exactamente lo mismo que
// crear el alumno a mano: mismo invite, mismo redirect a /configurar-password, mismo rol
// forzado (el rol NUNCA sale de la metadata del invite — ver handle_new_user en schema.sql).
async function invitarComoAlumno(datos: {
  nombre: string
  email: string
  telefono: string | null
  link_videollamada: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
}): Promise<{ id: string } | { error: string }> {
  const { nombre, email, telefono, link_videollamada, supabaseAdmin } = datos

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, telefono },
    redirectTo: INVITE_REDIRECT,
  })

  if (inviteError) return { error: inviteError.message }
  if (!invited?.user) return { error: 'No se pudo crear el usuario' }

  const { error: perfilError } = await supabaseAdmin.from('alumnos').upsert({
    id: invited.user.id,
    email,
    nombre,
    telefono,
    link_videollamada,
    rol: 'alumno',
    estado: 'activo',
  }, { onConflict: 'id' })
  if (perfilError) return { error: perfilError.message }

  return { id: invited.user.id }
}

export async function crearAlumnoDirecto(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const parsed = alumnoSchema.safeParse({
    nombre: formData.get('nombre') ?? '',
    email: formData.get('email') ?? '',
    telefono: formData.get('telefono') ?? '',
    link_videollamada: formData.get('link_videollamada') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { nombre, email } = parsed.data
  const programas = formData.getAll('programas') as string[]

  const supabaseAdmin = createAdminClient()

  const creado = await invitarComoAlumno({
    nombre,
    email,
    telefono: parsed.data.telefono || null,
    link_videollamada: parsed.data.link_videollamada || null,
    supabaseAdmin,
  })
  if ('error' in creado) return { error: creado.error }

  if (programas.length > 0) {
    await supabaseAdmin.from('programas_asignados').delete().eq('alumno_id', creado.id)
    const asignaciones = programas.map(programa_id => ({ alumno_id: creado.id, programa_id }))
    const { error: progErr } = await supabaseAdmin.from('programas_asignados').insert(asignaciones)
    if (progErr) return { error: progErr.message }
  }

  revalidatePath('/psicologo/alumnos')
  return { success: true }
}

// Aprobar = invitar a la persona que llenó el formulario público y marcar la solicitud
// como resuelta. `objetivos` NO se copia al perfil a propósito: es texto libre que la
// persona escribió sobre su situación, y el modelo del alumno es cuenta + contenido +
// agenda + progreso educativo (Ley 25.326). Queda donde ya estaba, en la solicitud.
export async function aprobarSolicitud(solicitudId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  if (!solicitudId) return { error: 'Falta la solicitud' }

  const supabaseAdmin = createAdminClient()

  const { data: solicitud, error: errorSolicitud } = await supabaseAdmin
    .from('solicitudes_registro')
    .select('id, nombre, email, telefono, estado')
    .eq('id', solicitudId)
    .maybeSingle()

  if (errorSolicitud) return { error: errorSolicitud.message }
  if (!solicitud) return { error: 'Esa solicitud ya no existe.' }
  if (solicitud.estado !== 'pendiente') return { error: 'Esa solicitud ya fue resuelta.' }

  const parsed = alumnoSchema.safeParse({
    nombre: solicitud.nombre ?? '',
    email: solicitud.email ?? '',
    telefono: solicitud.telefono ?? '',
    link_videollamada: '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Los datos de la solicitud no son válidos' }

  const { data: yaExiste } = await supabaseAdmin
    .from('alumnos')
    .select('id')
    .eq('email', parsed.data.email)
    .maybeSingle()
  if (yaExiste) return { error: 'Ya hay una cuenta con ese email. Revisá la pestaña Activos.' }

  const creado = await invitarComoAlumno({
    nombre: parsed.data.nombre,
    email: parsed.data.email,
    telefono: parsed.data.telefono || null,
    link_videollamada: null,
    supabaseAdmin,
  })
  if ('error' in creado) return { error: creado.error }

  const { error: errorEstado } = await supabaseAdmin
    .from('solicitudes_registro')
    .update({ estado: 'aprobada' })
    .eq('id', solicitudId)
  if (errorEstado) return { error: errorEstado.message }

  revalidatePath('/psicologo/alumnos')
  return { success: true }
}

// La solicitud no se borra: queda con estado 'rechazada' para que salga de la bandeja
// sin perder el registro de que esa persona escribió alguna vez.
export async function rechazarSolicitud(solicitudId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  if (!solicitudId) return { error: 'Falta la solicitud' }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('solicitudes_registro')
    .update({ estado: 'rechazada' })
    .eq('id', solicitudId)
    .eq('estado', 'pendiente')

  if (error) return { error: error.message }

  revalidatePath('/psicologo/alumnos')
  return { success: true }
}

export async function actualizarAlumno(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const link_videollamada = (formData.get('link_videollamada') as string)?.trim() || null

  if (!id || !nombre) return { error: 'Faltan datos obligatorios' }
  if (link_videollamada && !esUrlHttps(link_videollamada)) {
    return { error: 'El link de videollamada debe ser una URL https válida' }
  }

  const { error } = await supabase
    .from('alumnos')
    .update({ nombre, telefono, link_videollamada })
    .eq('id', id)

  if (error) return { error: error.message }

  const programasAsignados = formData.getAll('programas') as string[]
  const supabaseAdmin = createAdminClient()

  await supabaseAdmin.from('programas_asignados').delete().eq('alumno_id', id)
  if (programasAsignados.length > 0) {
    const asignaciones = programasAsignados.map(programa_id => ({ alumno_id: id, programa_id }))
    const { error: errorAsignaciones } = await supabaseAdmin.from('programas_asignados').insert(asignaciones)
    if (errorAsignaciones) return { error: errorAsignaciones.message }
  }

  revalidatePath('/psicologo/alumnos')
  return { success: true }
}

export async function cambiarEstadoAlumno(id: string, nuevoEstado: 'activo' | 'suspendido' | 'eliminado') {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const supabaseAdmin = createAdminClient()

  const { error: updateError } = await supabaseAdmin
    .from('alumnos')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  if (nuevoEstado === 'suspendido' || nuevoEstado === 'eliminado') {
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
    if (banError) return { error: banError.message }
  } else if (nuevoEstado === 'activo') {
    const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' })
    if (unbanError) return { error: unbanError.message }
  }

  revalidatePath('/psicologo/alumnos')
  return { success: true }
}

export async function eliminarUsuarioTotal(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (auth.user.id === id) return { error: 'No podés eliminar tu propia cuenta.' }

  const supabaseAdmin = createAdminClient()

  const tablasUsuario = ['programas_asignados', 'recursos_asignados', 'agenda_sesiones', 'cohortes_alumnos', 'progreso_lecciones', 'quiz_intentos', 'entregas']
  for (const tabla of tablasUsuario) {
    const { error } = await supabaseAdmin.from(tabla).delete().eq('alumno_id', id)
    if (error) console.error(`Error borrando ${tabla} del alumno (se continúa):`, error.message)
  }

  await supabaseAdmin.from('alumnos').delete().eq('id', id)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) return { error: authError.message }

  revalidatePath('/psicologo/alumnos')
  return { success: true }
}

// ============================================================
// PROGRAMAS / MÓDULOS / LECCIONES
// ============================================================

export async function guardarPrograma(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string | null
  const titulo = (formData.get('titulo') as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null

  if (!titulo) return { error: 'El título es obligatorio' }

  if (id) {
    const { error } = await supabase.from('programas').update({ titulo, descripcion }).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('programas').insert({ titulo, descripcion })
    if (error) return { error: error.message }
  }

  revalidatePath('/psicologo/programas')
  return { success: true }
}

export async function eliminarPrograma(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: lecciones } = await supabase
    .from('lecciones')
    .select('tipo_contenido, url_recurso')
    .eq('programa_id', id)

  const { error } = await supabase.from('programas').delete().eq('id', id)
  if (error) return { error: error.message }

  await limpiarArchivosDeStorage(lecciones || [])

  revalidatePath('/psicologo/programas')
  return { success: true }
}

export async function guardarModulo(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string | null
  const programa_id = formData.get('programa_id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null

  if (!titulo) return { error: 'El título es obligatorio' }

  if (id) {
    const { error } = await supabase.from('modulos').update({ titulo, descripcion }).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const orden = await siguienteOrden(supabase, 'modulos', 'programa_id', programa_id)
    const { error } = await supabase.from('modulos').insert({ programa_id, titulo, descripcion, orden })
    if (error) return { error: error.message }
  }

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function eliminarModulo(id: string, programa_id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: lecciones } = await supabase
    .from('lecciones')
    .select('tipo_contenido, url_recurso')
    .eq('modulo_id', id)

  const { error } = await supabase.from('modulos').delete().eq('id', id)
  if (error) return { error: error.message }

  await limpiarArchivosDeStorage(lecciones || [])

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function guardarLeccion(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string | null
  const programa_id = formData.get('programa_id') as string
  const modulo_id = formData.get('modulo_id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const tipo_contenido = formData.get('tipo_contenido') as string
  let url_recurso = (formData.get('url_recurso') as string)?.trim() || ''
  // Solo tiene sentido para 'entrega'; para el resto se guarda null aunque el form la mande.
  const fechaLimiteRaw = (formData.get('fecha_limite') as string) || ''
  const fecha_limite = tipo_contenido === 'entrega' && fechaLimiteRaw ? new Date(fechaLimiteRaw).toISOString() : null

  if (!titulo || !tipo_contenido) return { error: 'Faltan datos obligatorios' }
  if (!(TIPOS_LECCION as readonly string[]).includes(tipo_contenido)) return { error: 'Tipo de contenido inválido' }
  if (tipo_contenido === 'quiz') url_recurso = ''
  const errRecurso = errorEnRecurso(tipo_contenido, url_recurso)
  if (errRecurso) return { error: errRecurso }

  const tipo_medio = tipoMedioPorTipoContenido(tipo_contenido)
  const origen = origenPorUrlRecurso(url_recurso, tipo_contenido)

  if (id) {
    const { data: anterior } = await supabase
      .from('lecciones')
      .select('tipo_contenido, url_recurso')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('lecciones')
      .update({ titulo, tipo_contenido, url_recurso, modulo_id, fecha_limite, tipo_medio, origen })
      .eq('id', id)
    if (error) return { error: error.message }

    if (anterior && anterior.url_recurso !== url_recurso) {
      await limpiarArchivosDeStorage([anterior])
    }
  } else {
    const orden = await siguienteOrden(supabase, 'lecciones', 'modulo_id', modulo_id)
    const { error } = await supabase
      .from('lecciones')
      .insert({ programa_id, modulo_id, titulo, tipo_contenido, url_recurso, orden, fecha_limite, tipo_medio, origen })
    if (error) return { error: error.message }
  }

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function eliminarLeccion(id: string, programa_id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: leccion } = await supabase
    .from('lecciones')
    .select('tipo_contenido, url_recurso')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('lecciones').delete().eq('id', id)
  if (error) return { error: error.message }

  if (leccion) await limpiarArchivosDeStorage([leccion])

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

// Reordenamiento: intercambia el `orden` con el vecino en la dirección pedida.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function moverEntidad(supabase: any, tabla: string, scopeCol: string, scopeVal: string, id: string, dir: 'up' | 'down') {
  const { data: items } = await supabase
    .from(tabla)
    .select('id, orden')
    .eq(scopeCol, scopeVal)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true })
  if (!items) return
  const idx = items.findIndex((i: { id: string }) => i.id === id)
  if (idx < 0) return
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= items.length) return
  const a = items[idx], b = items[swapIdx]
  await supabase.from(tabla).update({ orden: b.orden }).eq('id', a.id)
  await supabase.from(tabla).update({ orden: a.orden }).eq('id', b.id)
}

export async function moverModulo(id: string, programa_id: string, dir: 'up' | 'down') {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  await moverEntidad(auth.supabase, 'modulos', 'programa_id', programa_id, id, dir)
  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function moverLeccion(id: string, modulo_id: string, programa_id: string, dir: 'up' | 'down') {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  await moverEntidad(auth.supabase, 'lecciones', 'modulo_id', modulo_id, id, dir)
  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function siguienteOrden(supabase: any, tabla: string, scopeCol: string, scopeVal: string): Promise<number> {
  const { data } = await supabase
    .from(tabla).select('orden').eq(scopeCol, scopeVal)
    .order('orden', { ascending: false }).limit(1).maybeSingle()
  return (data?.orden ?? -1) + 1
}

// ============================================================
// QUIZ (preguntas de comprensión — educativas)
// ============================================================

const preguntaSchema = z.object({
  pregunta: z.string().trim().min(1).max(1000),
  opciones: z.array(z.string().trim().min(1).max(500)).min(2).max(8),
  respuesta_correcta: z.string().trim().min(1).max(500),
}).refine(p => p.opciones.includes(p.respuesta_correcta), {
  message: 'La respuesta correcta debe ser una de las opciones',
})

export async function guardarQuizPreguntas(leccionId: string, programaId: string, preguntasJson: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  let parsed: unknown
  try { parsed = JSON.parse(preguntasJson) } catch { return { error: 'El JSON de preguntas es inválido' } }
  const arr = z.array(preguntaSchema).max(50).safeParse(parsed)
  if (!arr.success) return { error: arr.error.issues[0]?.message ?? 'Preguntas inválidas' }

  await supabase.from('quiz_preguntas').delete().eq('leccion_id', leccionId)
  if (arr.data.length > 0) {
    const filas = arr.data.map((p, i) => ({
      leccion_id: leccionId,
      pregunta: p.pregunta,
      opciones: p.opciones,
      respuesta_correcta: p.respuesta_correcta,
      orden: i,
    }))
    const { error } = await supabase.from('quiz_preguntas').insert(filas)
    if (error) return { error: error.message }
  }

  revalidatePath(`/psicologo/programas/${programaId}`)
  return { success: true }
}

// ============================================================
// ENTREGAS (revisión por el instructor)
// ============================================================

export async function revisarEntrega(entregaId: string, comentario: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { error } = await supabase
    .from('entregas')
    .update({ estado: 'revisada', comentario_instructor: comentario?.trim() || null })
    .eq('id', entregaId)

  if (error) return { error: error.message }

  revalidatePath('/psicologo/entregas')
  return { success: true }
}

// ============================================================
// COHORTES
// ============================================================

// Una comisión puede cursar VARIOS programas (tabla puente cohortes_programas). La
// columna vieja cohortes.programa_id quedó nullable por compatibilidad de deploy, pero
// ya no se lee ni se escribe desde acá: la fuente de verdad es la tabla puente.
async function guardarProgramasDeCohorte(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  cohorteId: string,
  programaIds: string[],
): Promise<{ error: string } | { ok: true }> {
  const { error: errorBorrado } = await supabaseAdmin
    .from('cohortes_programas')
    .delete()
    .eq('cohorte_id', cohorteId)
    .not('programa_id', 'in', `(${programaIds.join(',')})`)
  if (errorBorrado) return { error: errorBorrado.message }

  const { error } = await supabaseAdmin
    .from('cohortes_programas')
    .upsert(
      programaIds.map((programa_id) => ({ cohorte_id: cohorteId, programa_id })),
      { onConflict: 'cohorte_id,programa_id' },
    )
  if (error) return { error: error.message }

  return { ok: true }
}

// Los inscriptos de una comisión tienen acceso a TODOS sus programas. Se recalcula acá y
// no solo al inscribir, para que sumarle un programa a una comisión que ya tiene gente
// adentro les llegue sin volver a tocar la inscripción.
async function sincronizarAccesosDeCohorte(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  cohorteId: string,
): Promise<void> {
  const [{ data: inscriptos }, { data: programas }] = await Promise.all([
    supabaseAdmin.from('cohortes_alumnos').select('alumno_id').eq('cohorte_id', cohorteId),
    supabaseAdmin.from('cohortes_programas').select('programa_id').eq('cohorte_id', cohorteId),
  ])

  if (!inscriptos?.length || !programas?.length) return

  const accesos = inscriptos.flatMap((i: { alumno_id: string }) =>
    programas.map((p: { programa_id: string }) => ({ alumno_id: i.alumno_id, programa_id: p.programa_id })),
  )
  await supabaseAdmin.from('programas_asignados').upsert(accesos, { onConflict: 'alumno_id,programa_id' })
}

export async function guardarCohorte(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string | null
  const nombre = (formData.get('nombre') as string)?.trim()
  const programaIds = (formData.getAll('programas') as string[]).filter(Boolean)
  const fecha_inicio = (formData.get('fecha_inicio') as string) || null
  const fecha_fin = (formData.get('fecha_fin') as string) || null

  const hora_inicio = (formData.get('hora_inicio') as string) || null
  const hora_fin = (formData.get('hora_fin') as string) || null
  const dias = (formData.getAll('dias_semana') as string[])
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  const dias_semana = dias.length > 0 ? [...new Set(dias)].sort() : null

  if (!nombre) return { error: 'El nombre es obligatorio' }
  if (programaIds.length === 0) return { error: 'Elegí al menos un programa' }
  if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) {
    return { error: 'La fecha de fin no puede ser anterior a la de inicio' }
  }
  // Mismo check que la tabla, pero con un mensaje que se entiende.
  if (hora_inicio && hora_fin && hora_fin <= hora_inicio) {
    return { error: 'La hora de fin tiene que ser posterior a la de inicio' }
  }
  if (dias_semana && !hora_inicio) return { error: 'Si elegís días, poné también la hora de inicio' }

  const campos = { nombre, fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin }
  const supabaseAdmin = createAdminClient()

  let cohorteId = id
  if (id) {
    const { error } = await supabase.from('cohortes').update(campos).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { data, error } = await supabase.from('cohortes').insert(campos).select('id').single()
    if (error) return { error: error.message }
    cohorteId = data.id
  }

  const guardados = await guardarProgramasDeCohorte(supabaseAdmin, cohorteId as string, programaIds)
  if ('error' in guardados) return { error: guardados.error }

  await sincronizarAccesosDeCohorte(supabaseAdmin, cohorteId as string)

  revalidatePath('/psicologo/cohortes')
  revalidatePath('/alumno/programas')
  return { success: true }
}

export async function eliminarCohorte(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { error } = await supabase.from('cohortes').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/psicologo/cohortes')
  revalidatePath('/psicologo/agenda')
  return { success: true }
}

// Inscribe alumnos a una comisión y les da acceso a todos sus programas.
export async function inscribirAlumnosEnCohorte(cohorteId: string, alumnoIds: string[]) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const supabaseAdmin = createAdminClient()
  if (alumnoIds.length > 0) {
    const inscripciones = alumnoIds.map(alumno_id => ({ cohorte_id: cohorteId, alumno_id }))
    const { error } = await supabaseAdmin.from('cohortes_alumnos').upsert(inscripciones, { onConflict: 'cohorte_id,alumno_id' })
    if (error) return { error: error.message }
  }

  await sincronizarAccesosDeCohorte(supabaseAdmin, cohorteId)

  revalidatePath('/psicologo/cohortes')
  revalidatePath('/alumno/programas')
  return { success: true }
}

export async function quitarAlumnoDeCohorte(cohorteId: string, alumnoId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const supabaseAdmin = createAdminClient()

  const { data: programasDeEsta } = await supabaseAdmin
    .from('cohortes_programas').select('programa_id').eq('cohorte_id', cohorteId)

  await supabaseAdmin.from('cohortes_alumnos').delete().eq('cohorte_id', cohorteId).eq('alumno_id', alumnoId)

  // Se revoca solo lo que el alumno ya no tenga por otra comisión. Con varios programas
  // por comisión esto deja de ser un booleano: hay que restar conjuntos, porque dos
  // comisiones distintas pueden compartir parte de los programas.
  const idsDeEsta = (programasDeEsta ?? []).map((p: { programa_id: string }) => p.programa_id)
  if (idsDeEsta.length > 0) {
    const { data: otrasCohortes } = await supabaseAdmin
      .from('cohortes_alumnos').select('cohorte_id').eq('alumno_id', alumnoId)

    const idsOtras = (otrasCohortes ?? []).map((c: { cohorte_id: string }) => c.cohorte_id)
    let conservados: string[] = []
    if (idsOtras.length > 0) {
      const { data: programasQueSiguen } = await supabaseAdmin
        .from('cohortes_programas').select('programa_id').in('cohorte_id', idsOtras)
      conservados = (programasQueSiguen ?? []).map((p: { programa_id: string }) => p.programa_id)
    }

    const aRevocar = idsDeEsta.filter((p: string) => !conservados.includes(p))
    if (aRevocar.length > 0) {
      await supabaseAdmin
        .from('programas_asignados').delete().eq('alumno_id', alumnoId).in('programa_id', aRevocar)
    }
  }

  revalidatePath('/psicologo/cohortes')
  revalidatePath('/alumno/programas')
  return { success: true }
}

// Agenda las clases que salen del horario de la comisión, entre su fecha de inicio y la
// de fin. Son filas normales de agenda_sesiones con cohorte_id: la policy agenda_select
// ya hace que las vea cada inscripto, así que no hace falta una fila por alumno.
//
// Idempotente y no destructiva: lee lo que ya está agendado para esa comisión y solo
// inserta los horarios que faltan. Volver a apretar el botón no duplica, y las clases del
// horario viejo (o las cargadas a mano desde Agenda) no se tocan — si el horario cambió,
// la UI avisa cuáles quedaron fuera y el borrado es una decisión aparte.
export async function generarClasesDeCohorte(cohorteId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: cohorte, error: errorCohorte } = await supabase
    .from('cohortes')
    .select('id, nombre, fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin')
    .eq('id', cohorteId)
    .single()

  if (errorCohorte || !cohorte) return { error: 'No se encontró la comisión' }
  if (!horarioCompleto(cohorte)) {
    return { error: 'Faltan datos del horario: días, hora de inicio y las dos fechas.' }
  }

  const fechas = fechasDeClases(cohorte)
  if (fechas.length === 0) return { error: 'Ese horario no cae ningún día dentro del rango de fechas.' }
  if (fechas.length >= MAXIMO_CLASES) {
    return { error: `El rango genera más de ${MAXIMO_CLASES} clases. Acortá las fechas.` }
  }

  const { data: yaAgendadas, error: errorAgenda } = await supabase
    .from('agenda_sesiones')
    .select('fecha_hora')
    .eq('cohorte_id', cohorteId)
  if (errorAgenda) return { error: errorAgenda.message }

  // Se compara por instante y no por string: la misma hora puede venir escrita distinto
  // ("+00:00" vs "Z", con o sin microsegundos) según cómo se haya guardado.
  const existentes = new Set((yaAgendadas ?? []).map((s: { fecha_hora: string }) => new Date(s.fecha_hora).getTime()))
  const faltantes = fechas.filter((f) => !existentes.has(new Date(f).getTime()))

  if (faltantes.length === 0) {
    return { success: true, creadas: 0, total: fechas.length }
  }

  const duracion = duracionMinutos(cohorte.hora_inicio as string, cohorte.hora_fin)
  const { error } = await supabase.from('agenda_sesiones').insert(
    faltantes.map((fecha_hora) => ({
      cohorte_id: cohorteId,
      alumno_id: null,
      fecha_hora,
      tipo: 'presencial',
      duracion_minutos: duracion,
    })),
  )
  if (error) return { error: error.message }

  revalidatePath('/psicologo/cohortes')
  revalidatePath('/psicologo/agenda')
  revalidatePath('/alumno/agenda')
  return { success: true, creadas: faltantes.length, total: fechas.length }
}

// Borra solo las clases FUTURAS de la comisión. Es la salida para cuando se cambió el
// horario y quedaron agendadas las del anterior; el pasado no se toca, porque son clases
// que efectivamente ocurrieron.
export async function borrarClasesFuturasDeCohorte(cohorteId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data, error } = await supabase
    .from('agenda_sesiones')
    .delete()
    .eq('cohorte_id', cohorteId)
    .gte('fecha_hora', new Date().toISOString())
    .select('id')

  if (error) return { error: error.message }

  revalidatePath('/psicologo/cohortes')
  revalidatePath('/psicologo/agenda')
  revalidatePath('/alumno/agenda')
  return { success: true, borradas: data?.length ?? 0 }
}

// ============================================================
// BIBLIOTECA DE RECURSOS
// ============================================================

export async function crearRecursoBiblioteca(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const titulo = (formData.get('titulo') as string)?.trim()
  const tipo_contenido = formData.get('tipo_contenido') as string
  const url_recurso = (formData.get('url_recurso') as string)?.trim()

  if (!titulo || !url_recurso) return { error: 'Título y recurso son obligatorios' }
  if (!(TIPOS_BIBLIOTECA as readonly string[]).includes(tipo_contenido)) return { error: 'Tipo de contenido inválido' }
  const errRecurso = errorEnRecurso(tipo_contenido, url_recurso)
  if (errRecurso) return { error: errRecurso }

  const { error } = await supabase
    .from('biblioteca_recursos')
    .insert({
      titulo, tipo_contenido, url_recurso,
      tipo_medio: tipoMedioPorTipoContenido(tipo_contenido),
      origen: origenPorUrlRecurso(url_recurso, tipo_contenido),
    })

  if (error) return { error: error.message }

  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/alumno/materiales')
  return { success: true }
}

export async function eliminarRecursoBiblioteca(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: recurso } = await supabase
    .from('biblioteca_recursos')
    .select('tipo_contenido, url_recurso')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('biblioteca_recursos')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  if (recurso) await limpiarArchivosDeStorage([recurso])

  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/alumno/materiales')
  return { success: true }
}

export async function asignarRecursoBiblioteca(recursoId: string, alumnoIds: string[]) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const supabaseAdmin = createAdminClient()

  await supabaseAdmin.from('recursos_asignados').delete().eq('recurso_id', recursoId)

  if (alumnoIds.length > 0) {
    const asignaciones = alumnoIds.map(alumnoId => ({
      recurso_id: recursoId,
      alumno_id: alumnoId
    }))
    const { error } = await supabaseAdmin.from('recursos_asignados').insert(asignaciones)
    if (error) return { error: error.message }
  }

  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/alumno/materiales', 'page')
  return { success: true }
}

// ============================================================
// AGENDA DE SESIONES (individual o por cohorte; virtual o presencial)
// ============================================================

// Lee alumno_id | cohorte_id + tipo + lugar + enlace del formData y arma el destino
function leerDestinoSesion(formData: FormData): { alumno_id: string | null, cohorte_id: string | null, tipo: string, lugar: string | null, enlace: string | null } | { error: string } {
  const alumno_id = (formData.get('alumno_id') as string) || null
  const cohorte_id = (formData.get('cohorte_id') as string) || null
  if ((alumno_id && cohorte_id) || (!alumno_id && !cohorte_id)) {
    return { error: 'Elegí un alumno o una cohorte (uno solo)' }
  }
  const tipo = ((formData.get('tipo') as string) || 'virtual')
  if (tipo !== 'virtual' && tipo !== 'presencial') return { error: 'Tipo de sesión inválido' }
  const lugar = tipo === 'presencial' ? ((formData.get('lugar') as string)?.trim() || null) : null
  const enlaceRaw = tipo === 'virtual' ? ((formData.get('enlace') as string)?.trim() || '') : ''
  if (enlaceRaw && !esUrlHttps(enlaceRaw)) return { error: 'El enlace debe ser una URL https válida' }
  return { alumno_id, cohorte_id, tipo, lugar, enlace: enlaceRaw || null }
}

export async function agregarSesionUnica(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const destino = leerDestinoSesion(formData)
  if ('error' in destino) return { error: destino.error }
  const fecha_hora = formData.get('fecha_hora') as string
  if (!fecha_hora) return { error: 'Falta la fecha y hora' }

  // "YYYY-MM-DDTHH:mm" sin zona: se interpreta como hora de Argentina, igual que el
  // horario de las comisiones. Con `new Date(str)` quedaba en la zona del servidor.
  const [diaUnica, horaUnica] = fecha_hora.split('T')
  const { error } = await supabase
    .from('agenda_sesiones')
    .insert({ ...destino, fecha_hora: instanteArgentina(diaUnica, horaUnica) })

  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}

export async function generarSesionesRecurrentes(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const destino = leerDestinoSesion(formData)
  if ('error' in destino) return { error: destino.error }
  const dia_semana = parseInt(formData.get('dia_semana') as string)
  const hora = formData.get('hora') as string
  const semanas = parseInt(formData.get('semanas') as string)

  if (isNaN(dia_semana) || !hora || isNaN(semanas)) return { error: 'Datos inválidos' }
  if (semanas < 1 || semanas > 52) return { error: 'Cantidad de semanas fuera de rango' }

  // El recorrido va sobre fechas ancladas en UTC (el día de la semana no puede depender
  // de la zona del runtime) y la hora se aplica con instanteArgentina, igual que las
  // clases de comisión — si no, la misma "21:00" cae en dos instantes distintos según por
  // dónde se haya agendado.
  const hoy = new Date()
  const cursor = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
  cursor.setUTCDate(cursor.getUTCDate() + ((dia_semana + 7 - cursor.getUTCDay()) % 7))

  const sesiones = []
  for (let i = 0; i < semanas; i++) {
    sesiones.push({ ...destino, fecha_hora: instanteArgentina(cursor.toISOString().slice(0, 10), hora) })
    cursor.setUTCDate(cursor.getUTCDate() + 7)
  }

  const { error } = await supabase.from('agenda_sesiones').insert(sesiones)
  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}

export async function eliminarSesionUnica(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { error } = await supabase.from('agenda_sesiones').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}

export async function eliminarTodaLaAgendaDelAlumno(alumnoId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { error } = await supabase.from('agenda_sesiones').delete().eq('alumno_id', alumnoId)
  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}
