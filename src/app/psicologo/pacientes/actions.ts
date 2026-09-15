'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requirePsicologo } from '@/utils/supabase/guards'
import { createAdminClient } from '@/utils/supabase/admin'
import { invitarUsuario, type Vinculo } from '@/utils/supabase/invitaciones'

// ============================================================
// PACIENTES
// ============================================================
//
// Un paciente es un usuario más de la tabla `alumnos` con `es_paciente = true` (ver
// snippets/2026-09-05b). NO es excluyente con `es_alumno`: alguien puede cursar una
// formación y además atenderse, y en ese caso aparece en las dos listas del panel.
// Todo lo que ya funcionaba para alumnos funciona igual acá sin duplicar nada: la
// invitación por email, el ban al suspender (cambiarEstadoAlumno), el borrado total
// (eliminarUsuarioTotal), la agenda de sesiones y las URLs firmadas del material.
//
// Lo único propio del vínculo de paciente es que no arrastra contenido de cursos: no se
// le asignan programas ni se le mide progreso *por ser paciente*. Se le agenda una sesión
// y se le entrega material puntual de la Biblioteca.
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

  // El alta desde este diálogo marca paciente; se puede marcar alumno además.
  const vinculo: Vinculo = {
    esAlumno: formData.get('es_alumno') === 'true',
    esPaciente: formData.get('es_paciente') !== 'false',
  }

  const supabaseAdmin = createAdminClient()

  // Un email ya usado no puede ser dos cuentas. Pero como el vínculo dejó de ser
  // excluyente, "ya existe" muchas veces significa "esta persona ya es tu alumna y ahora
  // además se atiende": en vez de mandar a inventar otro email, se apunta a marcarla
  // como paciente desde su ficha, que es lo que en realidad se quiere hacer.
  const { data: yaExiste } = await supabaseAdmin
    .from('alumnos')
    .select('id, nombre, es_paciente')
    .eq('email', parsed.data.email)
    .maybeSingle()
  if (yaExiste) {
    return {
      error: yaExiste.es_paciente
        ? `${yaExiste.nombre} ya está en tu lista de pacientes.`
        : `Ese email ya tiene cuenta (${yaExiste.nombre}). Abrí su ficha en Alumnos y marcala también como paciente.`,
    }
  }

  const creado = await invitarUsuario({
    nombre: parsed.data.nombre,
    email: parsed.data.email,
    telefono: parsed.data.telefono || null,
    link_videollamada: parsed.data.link_videollamada || null,
    vinculo,
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

  // Sin tocar el vínculo ni `estado`: acá se editan datos de contacto y nada más. El
  // vínculo tiene su propia action (cambiarVinculo) y el estado también
  // (cambiarEstadoAlumno).
  const { error } = await supabase
    .from('alumnos')
    .update({ nombre, telefono, link_videollamada })
    .eq('id', id)
    .eq('es_paciente', true)

  if (error) return { error: error.message }

  revalidatePath('/psicologo/pacientes')
  return { success: true }
}

/**
 * Cambia qué es una persona para el psicólogo: alumno, paciente o las dos cosas.
 * La usan las dos listas (Alumnos y Pacientes) desde la ficha de cada persona.
 *
 * Desmarcar un vínculo NO borra nada: la cuenta, la agenda y el material asignado quedan
 * intactos, la persona sale de esa lista y deja de ver ese menú. Para dar de baja de
 * verdad están suspender/archivar/eliminar, que son otra cosa.
 */
export async function cambiarVinculo(id: string, vinculo: { esAlumno: boolean, esPaciente: boolean }) {
  const auth = await requirePsicologo()
  if ('error' in auth) return { error: auth.error }

  if (!id) return { error: 'Falta la persona' }
  if (!vinculo.esAlumno && !vinculo.esPaciente) {
    return { error: 'Tiene que ser alumno, paciente, o las dos cosas. Si querés darlo de baja, usá Suspender o Archivar.' }
  }

  const supabaseAdmin = createAdminClient()

  // El psicólogo no es alumno ni paciente de sí mismo: sin este guard, un clic en su
  // propia fila lo metería en las listas y le cambiaría el menú al entrar.
  const { data: destino } = await supabaseAdmin
    .from('alumnos')
    .select('id, rol')
    .eq('id', id)
    .maybeSingle()
  if (!destino) return { error: 'Esa persona ya no existe.' }
  if (destino.rol === 'psicologo') return { error: 'No podés asignarte a vos mismo como alumno o paciente.' }

  const { error } = await supabaseAdmin
    .from('alumnos')
    .update({ es_alumno: vinculo.esAlumno, es_paciente: vinculo.esPaciente })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/psicologo/alumnos')
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
  // persona antes de escribir, así que apuntarla sin querer a alguien que no lo es le
  // vaciaría la biblioteca. Para quien es alumno Y paciente el reemplazo igual es
  // correcto: el diálogo se abre con TODO lo que esa persona tiene asignado (venga del
  // vínculo que venga), así que guardar no puede perder nada que no se haya desmarcado.
  // Lo que llega por cohorte no vive acá (cohortes_recursos), así que ni se toca.
  const { data: destino } = await supabaseAdmin
    .from('alumnos')
    .select('id, es_paciente')
    .eq('id', pacienteId)
    .maybeSingle()
  if (!destino) return { error: 'Ese paciente ya no existe.' }
  if (!destino.es_paciente) return { error: 'Esa persona no es un paciente.' }

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
