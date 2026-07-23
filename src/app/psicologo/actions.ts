'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePsicologo } from '@/utils/supabase/guards'
import { createAdminClient } from '@/utils/supabase/admin'
import { BUCKET_MATERIALES, esArchivoSubido } from '@/utils/supabase/recursos'

// URL base para los redirects de invitación (localhost en dev, VERCEL_URL/SITE_URL en prod)
function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

// Los invitados deben pasar por /configurar-password antes de entrar al portal
const INVITE_REDIRECT = `${baseUrl()}/auth/confirm?next=/configurar-password`

// Borra del bucket los archivos subidos (ignora URLs externas)
async function limpiarArchivosDeStorage(recursos: { tipo_contenido: string; url_recurso: string }[]) {
  const paths = recursos
    .filter(r => esArchivoSubido(r.tipo_contenido) && r.url_recurso && !r.url_recurso.startsWith('http'))
    .map(r => r.url_recurso)
  if (paths.length === 0) return
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.storage.from(BUCKET_MATERIALES).remove(paths)
  if (error) console.error('Error limpiando Storage (se continúa):', error.message)
}

// ============================================================
// PACIENTES
// ============================================================

const pacienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no es válido').max(254),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  link_videollamada: z.string().trim().max(500).optional().or(z.literal('')),
})

export async function crearPacienteDirecto(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const parsed = pacienteSchema.safeParse({
    nombre: formData.get('nombre') ?? '',
    email: formData.get('email') ?? '',
    telefono: formData.get('telefono') ?? '',
    link_videollamada: formData.get('link_videollamada') ?? '',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { nombre, email } = parsed.data
  const telefono = parsed.data.telefono || null
  const link_videollamada = parsed.data.link_videollamada || null
  const programas = formData.getAll('programas') as string[]

  const supabaseAdmin = createAdminClient()

  // Creamos + invitamos al paciente (recibe email para setear contraseña vía /configurar-password)
  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, telefono },
    redirectTo: INVITE_REDIRECT,
  })

  if (inviteError) return { error: inviteError.message }
  if (!invited?.user) return { error: 'No se pudo crear el usuario' }

  const newId = invited.user.id

  // Perfil completo (defensivo: funciona aunque el trigger no exista)
  const { error: perfilError } = await supabaseAdmin.from('pacientes').upsert({
    id: newId,
    email,
    nombre,
    telefono,
    link_videollamada,
    rol: 'paciente',
    estado: 'activo',
  }, { onConflict: 'id' })
  if (perfilError) return { error: perfilError.message }

  // Programas asignados
  if (programas.length > 0) {
    await supabaseAdmin.from('programas_asignados').delete().eq('paciente_id', newId)
    const asignaciones = programas.map(programa_id => ({ paciente_id: newId, programa_id }))
    const { error: progErr } = await supabaseAdmin.from('programas_asignados').insert(asignaciones)
    if (progErr) return { error: progErr.message }
  }

  revalidatePath('/psicologo/pacientes')
  return { success: true }
}

export async function actualizarPaciente(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string
  const nombre = (formData.get('nombre') as string)?.trim()
  const telefono = (formData.get('telefono') as string)?.trim() || null
  const link_videollamada = (formData.get('link_videollamada') as string)?.trim() || null

  if (!id || !nombre) return { error: 'Faltan datos obligatorios' }

  const { error } = await supabase
    .from('pacientes')
    .update({ nombre, telefono, link_videollamada })
    .eq('id', id)

  if (error) return { error: error.message }

  // Programas asignados: el cliente admin saltea RLS para gestionar datos de otro usuario
  const programasAsignados = formData.getAll('programas') as string[]
  const supabaseAdmin = createAdminClient()

  await supabaseAdmin.from('programas_asignados').delete().eq('paciente_id', id)
  if (programasAsignados.length > 0) {
    const asignaciones = programasAsignados.map(programa_id => ({ paciente_id: id, programa_id }))
    const { error: errorAsignaciones } = await supabaseAdmin.from('programas_asignados').insert(asignaciones)
    if (errorAsignaciones) return { error: errorAsignaciones.message }
  }

  revalidatePath('/psicologo/pacientes')
  return { success: true }
}

export async function cambiarEstadoPaciente(id: string, nuevoEstado: 'activo' | 'suspendido' | 'eliminado') {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const supabaseAdmin = createAdminClient()

  const { error: updateError } = await supabaseAdmin
    .from('pacientes')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (updateError) return { error: updateError.message }

  // Ban de Supabase Auth: el suspendido/eliminado no puede volver a loguearse
  if (nuevoEstado === 'suspendido' || nuevoEstado === 'eliminado') {
    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: '876000h' })
    if (banError) return { error: banError.message }
  } else if (nuevoEstado === 'activo') {
    const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(id, { ban_duration: 'none' })
    if (unbanError) return { error: unbanError.message }
  }

  revalidatePath('/psicologo/pacientes')
  return { success: true }
}

export async function eliminarUsuarioTotal(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  // El psicólogo no puede autoeliminarse por accidente
  if (auth.user.id === id) return { error: 'No podés eliminar tu propia cuenta.' }

  const supabaseAdmin = createAdminClient()

  // 1. Borrar explícitamente todas las filas del paciente (por si algún FK no está en CASCADE)
  const tablasUsuario = ['programas_asignados', 'recursos_asignados', 'agenda_sesiones']
  for (const tabla of tablasUsuario) {
    const { error } = await supabaseAdmin.from(tabla).delete().eq('paciente_id', id)
    if (error) console.error(`Error borrando ${tabla} del paciente (se continúa):`, error.message)
  }

  // 2. Borrar el perfil y el usuario de Auth (cierra su sesión y limpia restos por cascada)
  await supabaseAdmin.from('pacientes').delete().eq('id', id)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) return { error: authError.message }

  revalidatePath('/psicologo/pacientes')
  return { success: true }
}

// ============================================================
// PROGRAMAS / UNIDADES / ACTIVIDADES
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

  // Antes de que el CASCADE borre las actividades, juntamos los archivos subidos para limpiarlos
  const { data: actividades } = await supabase
    .from('actividades')
    .select('tipo_contenido, url_recurso')
    .eq('programa_id', id)

  const { error } = await supabase.from('programas').delete().eq('id', id)
  if (error) return { error: error.message }

  await limpiarArchivosDeStorage(actividades || [])

  revalidatePath('/psicologo/programas')
  return { success: true }
}

export async function guardarUnidad(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string | null
  const programa_id = formData.get('programa_id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const descripcion = (formData.get('descripcion') as string)?.trim() || null

  if (!titulo) return { error: 'El título es obligatorio' }

  if (id) {
    const { error } = await supabase.from('unidades').update({ titulo, descripcion }).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('unidades').insert({ programa_id, titulo, descripcion })
    if (error) return { error: error.message }
  }

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function eliminarUnidad(id: string, programa_id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: actividades } = await supabase
    .from('actividades')
    .select('tipo_contenido, url_recurso')
    .eq('unidad_id', id)

  const { error } = await supabase.from('unidades').delete().eq('id', id)
  if (error) return { error: error.message }

  await limpiarArchivosDeStorage(actividades || [])

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function guardarActividad(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const id = formData.get('id') as string | null
  const programa_id = formData.get('programa_id') as string
  const unidad_id = formData.get('unidad_id') as string
  const titulo = (formData.get('titulo') as string)?.trim()
  const tipo_contenido = formData.get('tipo_contenido') as string
  const url_recurso = (formData.get('url_recurso') as string)?.trim()

  if (!titulo || !tipo_contenido || !url_recurso) return { error: 'Faltan datos obligatorios' }

  if (id) {
    // Si se reemplazó un archivo subido, borramos el anterior del bucket
    const { data: anterior } = await supabase
      .from('actividades')
      .select('tipo_contenido, url_recurso')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('actividades')
      .update({ titulo, tipo_contenido, url_recurso, unidad_id })
      .eq('id', id)
    if (error) return { error: error.message }

    if (anterior && anterior.url_recurso !== url_recurso) {
      await limpiarArchivosDeStorage([anterior])
    }
  } else {
    const { error } = await supabase
      .from('actividades')
      .insert({ programa_id, unidad_id, titulo, tipo_contenido, url_recurso })
    if (error) return { error: error.message }
  }

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
}

export async function eliminarActividad(id: string, programa_id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { data: actividad } = await supabase
    .from('actividades')
    .select('tipo_contenido, url_recurso')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('actividades').delete().eq('id', id)
  if (error) return { error: error.message }

  if (actividad) await limpiarArchivosDeStorage([actividad])

  revalidatePath(`/psicologo/programas/${programa_id}`)
  return { success: true }
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

  const { error } = await supabase
    .from('biblioteca_recursos')
    .insert({ titulo, tipo_contenido, url_recurso })

  if (error) return { error: error.message }

  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/paciente/materiales')
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
  revalidatePath('/paciente/materiales')
  return { success: true }
}

export async function asignarRecursoBiblioteca(recursoId: string, pacienteIds: string[]) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  const supabaseAdmin = createAdminClient()

  // Limpiar relaciones previas para este recurso
  await supabaseAdmin.from('recursos_asignados').delete().eq('recurso_id', recursoId)

  // Insertar nuevas
  if (pacienteIds.length > 0) {
    const asignaciones = pacienteIds.map(pacienteId => ({
      recurso_id: recursoId,
      paciente_id: pacienteId
    }))
    const { error } = await supabaseAdmin.from('recursos_asignados').insert(asignaciones)
    if (error) return { error: error.message }
  }

  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/paciente/materiales', 'page')
  return { success: true }
}

// ============================================================
// AGENDA DE SESIONES
// ============================================================

export async function agregarSesionUnica(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const paciente_id = formData.get('paciente_id') as string
  const fecha_hora = formData.get('fecha_hora') as string

  if (!paciente_id || !fecha_hora) return { error: 'Faltan datos obligatorios' }

  const { error } = await supabase
    .from('agenda_sesiones')
    .insert({ paciente_id, fecha_hora: new Date(fecha_hora).toISOString() })

  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}

export async function generarSesionesRecurrentes(formData: FormData) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const paciente_id = formData.get('paciente_id') as string
  const dia_semana = parseInt(formData.get('dia_semana') as string)
  const hora = formData.get('hora') as string
  const semanas = parseInt(formData.get('semanas') as string)

  if (!paciente_id || isNaN(dia_semana) || !hora || isNaN(semanas)) return { error: 'Datos inválidos' }

  const sesiones = []
  const hoy = new Date()
  const fechaCalculada = new Date(hoy)

  // Buscar el próximo día que coincida
  fechaCalculada.setDate(hoy.getDate() + (dia_semana + 7 - hoy.getDay()) % 7)
  if (fechaCalculada < hoy) {
    fechaCalculada.setDate(fechaCalculada.getDate() + 7)
  }

  const [horas, minutos] = hora.split(':')

  for (let i = 0; i < semanas; i++) {
    const sesionDate = new Date(fechaCalculada)
    sesionDate.setHours(parseInt(horas), parseInt(minutos), 0, 0)

    sesiones.push({
      paciente_id,
      fecha_hora: sesionDate.toISOString()
    })

    // Sumar 7 días para la próxima semana
    fechaCalculada.setDate(fechaCalculada.getDate() + 7)
  }

  const { error } = await supabase
    .from('agenda_sesiones')
    .insert(sesiones)

  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}

export async function eliminarSesionUnica(id: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { error } = await supabase
    .from('agenda_sesiones')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}

export async function eliminarTodaLaAgendaDelPaciente(pacienteId: string) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }
  const { supabase } = auth

  const { error } = await supabase
    .from('agenda_sesiones')
    .delete()
    .eq('paciente_id', pacienteId)

  if (error) return { error: error.message }

  revalidatePath('/psicologo/agenda')
  return { success: true }
}
