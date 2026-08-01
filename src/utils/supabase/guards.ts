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
