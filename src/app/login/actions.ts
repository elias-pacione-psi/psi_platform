'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Qué error se le muestra a quien intenta entrar.
//
// Los errores que revelan si una cuenta existe (credenciales inválidas, cuenta
// suspendida, email sin confirmar) quedan todos bajo el mismo texto genérico: son la vía
// clásica de enumeración de usuarios. Los que NO dicen nada de la cuenta (rate limit,
// caída del proveedor) sí se muestran, porque son accionables y hasta ahora quedaban
// tapados por el mismo "usuario o contraseña no válidos" que todo lo demás.
//
// El motivo real siempre va a console.error: es lo único que queda en los logs de Vercel
// para diagnosticar un caso como el que reportaron los primeros alumnos, donde nadie
// podía saber por qué un login fallaba.
const ERROR_GENERICO = 'Email o contraseña incorrectos.'

function mensajeDeError(error: { code?: string; status?: number; message: string }): string {
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return 'Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.'
  }
  if (typeof error.status === 'number' && error.status >= 500) {
    return 'El servicio de acceso no está respondiendo. Probá de nuevo en un momento.'
  }
  return ERROR_GENERICO
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  // trim + lowercase, igual que el resto de los puntos de entrada del proyecto
  // (crear-cuenta/actions.ts, pacientes/actions.ts, con z.string().trim().toLowerCase()).
  // Ojo con la expectativa: el <input type="email"> ya recorta los espacios de los
  // extremos por spec, así que el trim sólo cubre a quien postee directo a la action.
  // Es consistencia defensiva — NO está confirmado que explique ninguno de los casos
  // que reportaron los primeros alumnos.
  const email = ((formData.get('email') as string | null) ?? '').trim().toLowerCase()
  const password = (formData.get('password') as string | null) ?? ''

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('[login] Falló el acceso:', {
      code: error.code,
      status: error.status,
      message: error.message,
    })
    return { error: mensajeDeError(error) }
  }

  // El psicólogo entra directo a su panel; el alumno a su espacio
  let destino = '/alumno'
  if (data.user) {
    const { data: perfil } = await supabase
      .from('alumnos')
      .select('rol')
      .eq('id', data.user.id)
      .single()
    if (perfil?.rol === 'psicologo') destino = '/psicologo'
  }

  revalidatePath('/', 'layout')
  redirect(destino)
}
