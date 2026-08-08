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

  // Vuelve a ESTA pantalla en estado de error, no a /login. Antes terminaba en
  // `/login?message=...`, y ahí se perdían dos cosas: /login es un componente cliente que
  // nunca leyó ese `message` (la persona veía un formulario pelado, sin motivo), y para
  // alguien recién invitado el login no es una salida — su cuenta existe pero todavía no
  // tiene contraseña. El estado de error de /auth/confirm explica qué pasó y ofrece el
  // enlace nuevo.
  redirect('/auth/confirm?error=vencido')
}
