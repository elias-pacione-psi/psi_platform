import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// El destino post-verificación sale de la URL, así que se acota a las rutas que el flujo
// realmente usa: sin esto, cualquiera arma un enlace de invitación que aterriza donde
// quiera, ya con la sesión del alumno abierta.
const DESTINOS_PERMITIDOS = new Set(['/alumno', '/configurar-password'])

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next') ?? '/alumno'
  const next = DESTINOS_PERMITIDOS.has(nextParam) ? nextParam : '/alumno'

  // Crear el entorno para la redirección final
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      // Remover los params de la url original si verifyOtp fue exitoso para limpiar la URL
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Si algo salió mal, enviarlo a login con un error genérico
  redirectTo.pathname = '/login'
  redirectTo.searchParams.set('message', 'El enlace es inválido o ha expirado.')
  return NextResponse.redirect(redirectTo)
}
