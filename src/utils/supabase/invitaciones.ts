import 'server-only'
import { baseUrl } from '@/utils/site-url'

// Alta de una persona en la plataforma: invitación por email + perfil en `alumnos`.
//
// Vive acá y no en una server action a propósito: la usan el módulo de Alumnos y el de
// Pacientes, y exportarla desde un archivo 'use server' la convertiría en un endpoint RPC
// que acepta un rol por parámetro desde el navegador. Acá es una función normal de
// servidor: solo la puede llamar código que ya pasó por requirePsicologo().

// Los invitados deben pasar por /configurar-password antes de entrar al portal
export const INVITE_REDIRECT = `${baseUrl()}/auth/confirm?next=/configurar-password`

/**
 * Qué es la persona para el psicólogo. NO es excluyente: alguien puede cursar una
 * formación y además atenderse. Es distinto del `rol` de la tabla, que es sólo el rol de
 * seguridad ('alumno' | 'psicologo') del que cuelga la RLS.
 */
export type Vinculo = { esAlumno: boolean; esPaciente: boolean }

/**
 * Invita por email y deja el perfil creado con el vínculo pedido. Sale de las actions para
 * que crear a mano y aprobar una solicitud del formulario público hagan exactamente lo
 * mismo: mismo invite, mismo redirect a /configurar-password, y el rol de seguridad
 * siempre forzado a 'alumno' desde el servidor (NUNCA sale de la metadata del invite —
 * ver handle_new_user en schema.sql). Sólo se llega a 'psicologo' con un UPDATE a mano
 * en la base, como siempre.
 */
export async function invitarUsuario(datos: {
  nombre: string
  email: string
  telefono: string | null
  link_videollamada: string | null
  vinculo: Vinculo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
}): Promise<{ id: string } | { error: string }> {
  const { nombre, email, telefono, link_videollamada, vinculo, supabaseAdmin } = datos

  if (!vinculo.esAlumno && !vinculo.esPaciente) {
    return { error: 'Elegí si la persona entra como alumno, como paciente, o las dos cosas.' }
  }

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
    es_alumno: vinculo.esAlumno,
    es_paciente: vinculo.esPaciente,
    estado: 'activo',
  }, { onConflict: 'id' })

  if (perfilError) {
    // Las columnas es_alumno/es_paciente no existen si el snippet SQL de 2026-09-05b no
    // se corrió: sin este mensaje el error que ve el psicólogo es un "column does not
    // exist" de PostgREST, que no dice qué hacer.
    if (/es_alumno|es_paciente/i.test(perfilError.message)) {
      return {
        error: 'La base todavía no tiene las columnas es_alumno/es_paciente. Corré '
          + 'supabase/snippets/2026-09-05b-alumno-y-paciente-no-excluyentes.sql en el SQL Editor.',
      }
    }
    return { error: perfilError.message }
  }

  // El mail de bienvenida sale del Send Email Hook de Supabase Auth (ver
  // supabase/functions/send-email), no de acá: inviteUserByEmail() ya dispara ese
  // hook con el link de invitación real, con nuestra marca. Mandar un segundo mail
  // desde acá duplicaría el aviso.
  return { id: invited.user.id }
}
