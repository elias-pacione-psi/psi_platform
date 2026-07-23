'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // El psicólogo entra directo a su panel; el paciente a su espacio
  let destino = '/paciente'
  if (data.user) {
    const { data: perfil } = await supabase
      .from('pacientes')
      .select('rol')
      .eq('id', data.user.id)
      .single()
    if (perfil?.rol === 'psicologo') destino = '/psicologo/pacientes'
  }

  revalidatePath('/', 'layout')
  redirect(destino)
}
