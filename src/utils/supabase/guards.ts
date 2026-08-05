import { createClient } from '@/utils/supabase/server'
import type { User } from '@supabase/supabase-js'

// Guardas de autorización compartidas por las server actions.
// Devuelven { error } o el cliente + usuario listos para usar.

type GuardResult =
  | { error: string }
  | { supabase: Awaited<ReturnType<typeof createClient>>; user: User }

export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Tener sesión no alcanza: la cuenta también tiene que estar activa. El ban de Auth que
  // pone cambiarEstadoAlumno() invalida el refresh token, pero NO el access token ya
  // emitido — con jwt_expiry = 3600 quedaba hasta una hora de acceso por API después de
  // suspender a alguien. El layout de /alumno tampoco alcanzaba: es gating de render, y
  // una server action es un POST que no pasa por ningún layout. Éste es el único punto
  // por el que entran todas las actions, así que es acá donde el estado se puede exigir.
  const { data: perfil } = await supabase
    .from('alumnos')
    .select('estado')
    .eq('id', user.id)
    .single()

  if (perfil?.estado !== 'activo') return { error: 'Tu cuenta no está activa.' }

  return { supabase, user }
}

export async function requirePsicologo(): Promise<GuardResult> {
  const auth = await requireUser()
  if ('error' in auth) return auth

  const { data: perfil } = await auth.supabase
    .from('alumnos')
    .select('rol')
    .eq('id', auth.user.id)
    .single()

  if (perfil?.rol !== 'psicologo') return { error: 'Permisos insuficientes' }
  return auth
}
