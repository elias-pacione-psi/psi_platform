'use server'

import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Mismo acotamiento que antes en route.ts: el destino post-verificación sale de la
// URL, así que se limita a las rutas que el flujo realmente usa.
const DESTINOS_PERMITIDOS = new Set(['/alumno', '/configurar-password'])

export async function confirmarAcceso(formData: FormData) {
  const token_hash = formData.get('token_hash') as string | null
  const type = formData.get('type') as EmailOtpType | null
  const nextParam = formData.get('next') as string | null
  const next = nextParam && DESTINOS_PERMITIDOS.has(nextParam) ? nextParam : '/alumno'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirect(next)
    }
  }

  redirect(`/login?message=${encodeURIComponent('El enlace es inválido o ha expirado.')}`)
}
