'use server'

import { requireUser } from '@/utils/supabase/guards'

const MIN_LEN = 12
const REQUISITOS: { regex: RegExp; label: string }[] = [
  { regex: /[a-z]/, label: 'una minúscula' },
  { regex: /[A-Z]/, label: 'una mayúscula' },
  { regex: /[0-9]/, label: 'un número' },
  { regex: /[^A-Za-z0-9]/, label: 'un símbolo' },
]

// Espejo server-side de la validación del cliente. Hace falta porque updateUser() llamado
// directo desde el navegador pega a /auth/v1/user con el access token: un POST a mano ahí
// saltea cualquier validación de la UI. Mismo esquema que /crear-cuenta (errorEnPassword
// en crear-cuenta/actions.ts). Mientras el dashboard de producción (Authentication →
// Policies) no quede alineado en 12+símbolos, este chequeo es la única barrera real.
function errorEnPassword(password: string): string | null {
  if (password.length < MIN_LEN) return `La contraseña tiene que tener al menos ${MIN_LEN} caracteres.`
  const faltantes = REQUISITOS.filter((r) => !r.regex.test(password)).map((r) => r.label)
  if (faltantes.length > 0) return `Falta al menos ${faltantes.join(', ')}.`
  return null
}

export async function cambiarPassword(password: string) {
  const errorPassword = errorEnPassword(password)
  if (errorPassword) return { error: errorPassword }

  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}
