'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// Endpoint público (formulario de la landing): validamos y acotamos todo para evitar spam/basura en la DB
const solicitudSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El email no es válido').max(254),
  telefono: z.string().trim().max(30),
  objetivos: z.string().trim().max(1000),
})

export async function crearSolicitud(formData: FormData) {
  const supabase = await createClient()

  const parsed = solicitudSchema.safeParse({
    nombre: formData.get('nombre') ?? '',
    email: formData.get('email') ?? '',
    telefono: formData.get('telefono') ?? '',
    objetivos: formData.get('objetivos') ?? '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { nombre, email, telefono, objetivos } = parsed.data

  // Anti-spam
  const supabaseAdmin = createAdminClient()
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const [{ count: porEmail }, { count: total }] = await Promise.all([
    supabaseAdmin.from('solicitudes_registro')
      .select('*', { count: 'exact', head: true })
      .eq('email', email).gte('created_at', desde),
    supabaseAdmin.from('solicitudes_registro')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', desde),
  ])

  // Mismo mensaje en los dos casos: no le confirmamos al que spamea cuál límite tocó.
  if ((porEmail ?? 0) >= 3 || (total ?? 0) >= 50) {
    return { error: 'Ya recibimos tu solicitud. Te contactamos a la brevedad.' }
  }

  const { error } = await supabaseAdmin
    .from('solicitudes_registro')
    .insert({
      nombre,
      email,
      telefono: telefono || null,
      objetivos: objetivos || null,
      estado: 'pendiente',
    })

  if (error) {
    console.error("Error insertando solicitud:", error)
    return { error: 'No se pudo enviar la solicitud. Intentá de nuevo.' }
  }

  return { success: true }
}
