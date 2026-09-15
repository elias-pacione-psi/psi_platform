import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ConfigurarPasswordClient } from './ConfigurarPasswordClient'

// A esta página se llega con la sesión que abre verifyOtp() en /auth/confirm. Si esa
// sesión no está (el enlace venció mientras la persona completaba el formulario, o entró
// a la URL directo), antes igual se renderizaba el formulario entero: recién al apretar
// "Guardar" fallaba updateUser() con un "Auth session missing!" en inglés dentro de un
// toast, sin ningún camino de salida — y quedaba creyendo que había puesto la contraseña.
// Se chequea acá y no en el middleware porque la ruta tiene que seguir siendo pública:
// quien llega con el enlace todavía no está logueado del modo habitual.
export default async function ConfigurarPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?error=enlace_invalido')

  return <ConfigurarPasswordClient />
}
