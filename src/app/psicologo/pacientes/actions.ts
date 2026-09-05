'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePsicologo } from '@/utils/supabase/guards'
import { createAdminClient } from '@/utils/supabase/admin'
import { invitarUsuario } from '@/utils/supabase/invitaciones'

// ============================================================
// PACIENTES
// ============================================================
//
// Un paciente es un usuario más de la tabla `alumnos` con rol = 'paciente' (ver
// snippets/2026-09-05-rol-paciente.sql). Todo lo que ya funcionaba para alumnos
// funciona igual acá sin duplicar nada: la invitación por email, el ban al suspender
// (cambiarEstadoAlumno), el borrado total (eliminarUsuarioTotal), la agenda de sesiones
// y las URLs firmadas del material.
//
// Lo único que NO comparte con un alumno es el contenido de cursos: a un paciente no se
// le asignan programas ni se le mide progreso. Se le agenda una sesión y se le entrega
// material puntual de la Biblioteca.
//
// LÍMITE LEGAL (Ley 25.326, ver AGENTS.md): acá no entra ningún dato clínico. Ni
// diagnóstico, ni motivo de consulta, ni notas de sesión. Si alguna vez hace falta un
// campo de texto libre sobre la persona, no va en este módulo.

const pacienteSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no es válido').max(254),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  link_videollamada: z.string().trim().max(500)
    .refine(v => v === '' || esUrlHttps(v), 'El link de videollamada debe ser una URL https válida')
    .optional().or(z.literal('')),
})

// El link de videollamada termina en window.open() y en el botón del email de sesión:
// nunca aceptar algo que no sea https (mismo criterio que psicologo/actions.ts).
function esUrlHttps(valor: string): boolean {
  try { return new URL(valor).protocol === 'https:' } catch { return false }
}

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

  const supabaseAdmin = createAdminClient()

  // Un email ya usado no puede ser dos cuentas: sin este chequeo, inviteUserByEmail
  // devuelve un error de Auth que no dice en qué lista está la persona.
  const { data: yaExiste } = await supabaseAdmin
    .from('alumnos')
    .select('id, rol')
    .eq('email', parsed.data.email)
    .maybeSingle()
  if (yaExiste) {
    return {
      error: yaExiste.rol === 'paciente'
        ? 'Ya hay un paciente con ese email.'
        : `Ese email ya tiene una cuenta como ${yaExiste.rol}. Usá otro email.`,
    }
  }

  const creado = await invitarUsuario({
    nombre: parsed.data.nombre,
    email: parsed.data.email,
    telefono: parsed.data.telefono || null,
    link_videollamada: parsed.data.link_videollamada || null,
    rol: 'paciente',
    supabaseAdmin,
  })
  if ('error' in creado) return { error: creado.error }

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
  if (link_videollamada && !esUrlHttps(link_videollamada)) {
    return { error: 'El link de videollamada debe ser una URL https válida' }
  }

  // Sin tocar `rol` ni `estado`: acá se editan datos de contacto y nada más. El rol se
  // decide al crear y el estado tiene su propia action (cambiarEstadoAlumno).
  const { error } = await supabase
    .from('alumnos')
    .update({ nombre, telefono, link_videollamada })
    .eq('id', id)
    .eq('rol', 'paciente')

  if (error) return { error: error.message }

  revalidatePath('/psicologo/pacientes')
  return { success: true }
}

/**
 * Reemplaza el material de Biblioteca entregado a un paciente por la lista que llega.
 * Es la misma tabla puente que usa "Gestionar accesos" de Biblioteca (recursos_asignados),
 * mirada desde el otro eje: allá es un recurso → varias personas, acá una persona → varios
 * recursos. Por eso el borrado previo va por alumno_id y no por recurso_id.
 */
export async function entregarMaterialAPaciente(pacienteId: string, recursoIds: string[]) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!pacienteId) return { error: 'Falta el paciente' }

  const supabaseAdmin = createAdminClient()

  // Que el destino sea realmente un paciente: esta action borra TODO lo asignado a esa
  // persona antes de escribir, así que apuntarla sin querer a un alumno le vaciaría la
  // biblioteca (incluido lo que le llegó por su formación).
  const { data: destino } = await supabaseAdmin
    .from('alumnos')
    .select('id, rol')
    .eq('id', pacienteId)
    .maybeSingle()
  if (!destino) return { error: 'Ese paciente ya no existe.' }
  if (destino.rol !== 'paciente') return { error: 'Esa persona no es un paciente.' }

  await supabaseAdmin.from('recursos_asignados').delete().eq('alumno_id', pacienteId)

  if (recursoIds.length > 0) {
    const filas = recursoIds.map((recurso_id) => ({ alumno_id: pacienteId, recurso_id }))
    const { error } = await supabaseAdmin.from('recursos_asignados').insert(filas)
    if (error) return { error: error.message }
  }

  revalidatePath('/psicologo/pacientes')
  revalidatePath('/psicologo/biblioteca')
  revalidatePath('/alumno/materiales', 'page')
  return { success: true }
}
