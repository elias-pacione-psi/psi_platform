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

export type RolInvitable = 'alumno' | 'paciente'

/**
 * Invita por email y deja el perfil creado con el rol pedido. Sale de las actions para que
 * crear a mano, aprobar una solicitud del formulario público y dar de alta un paciente
 * hagan exactamente lo mismo: mismo invite, mismo redirect a /configurar-password, mismo
 * rol forzado desde el servidor (el rol NUNCA sale de la metadata del invite — ver
 * handle_new_user en schema.sql, que siempre lo hace nacer 'alumno').
 */
export async function invitarUsuario(datos: {
  nombre: string
  email: string
  telefono: string | null
  link_videollamada: string | null
  rol: RolInvitable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any
}): Promise<{ id: string } | { error: string }> {
  const { nombre, email, telefono, link_videollamada, rol, supabaseAdmin } = datos

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
    rol,
    estado: 'activo',
  }, { onConflict: 'id' })

  if (perfilError) {
    // El check de alumnos.rol todavía no acepta 'paciente' si el snippet SQL de
    // 2026-09-05 no se corrió: sin este mensaje el error que ve el psicólogo es
    // "violates check constraint", que no dice qué hacer.
    if (rol === 'paciente' && /check constraint|alumnos_rol_check/i.test(perfilError.message)) {
      return {
        error: 'La base todavía no acepta el rol "paciente". Corré '
          + 'supabase/snippets/2026-09-05-rol-paciente.sql en el SQL Editor de Supabase.',
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
