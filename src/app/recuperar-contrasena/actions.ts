'use server'

import { createClient } from '@/utils/supabase/server'
import { baseUrl } from '@/utils/site-url'

export async function enviarInstrucciones(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl()}/auth/confirm?type=recovery&next=/configurar-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
