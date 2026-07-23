'use server'

import { createClient } from '@/utils/supabase/server'

export async function enviarInstrucciones(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  // Obtenemos el origen de la URL (si estamos en vercel localmente o en prod)
  // En Next.js Server Actions podemos usar request headers o variables de entorno.
  // Es más seguro configurar la URL base como entorno.
  // Para Vercel automáticamente toma de VERCEL_URL, o sino fallback a localhost
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/confirm?type=recovery&next=/configurar-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
