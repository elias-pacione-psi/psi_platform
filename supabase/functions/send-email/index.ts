// Send Email Hook de Supabase Auth: intercepta TODOS los mails de Auth (invite,
// recovery, magiclink, etc.) antes de que Supabase los mande con su template
// genérico, y los manda por acá con nuestra marca vía Resend.
//
// Implementado siguiendo la guía oficial de Supabase para este caso exacto (React
// Email + Resend vía Send Email Hook):
// https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend
//
// Configuración: ver docs/setup-emails.md — local en supabase/config.toml
// ([auth.hook.send_email]), producción en el Dashboard (Authentication → Hooks).
import React from 'npm:react@19.2.4'
import { Webhook } from 'npm:standardwebhooks'
import { Resend } from 'npm:resend@6.18.1'
import { render } from 'npm:@react-email/render@2.1.0'
import { InviteEmail } from './_templates/InviteEmail.tsx'
import { RecuperarPasswordEmail } from './_templates/RecuperarPasswordEmail.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const REMITENTE = Deno.env.get('RESEND_FROM') ?? 'notificaciones@eliaspacione.com'

// El secret que genera el Dashboard viene con el formato "v1,whsec_<base64>". SIN
// VERIFICAR contra un hook real todavía si standardwebhooks espera el secret con el
// prefijo "whsec_" incluido o sin él — acá se lo dejamos puesto (solo se saca el "v1,")
// porque es la lectura más literal del formato documentado. Si la verificación de firma
// falla apenas se pruebe el primer invite real, este `.replace()` es el primer sospechoso.
const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string).replace('v1,', '')

interface SendEmailHookPayload {
  user: {
    email: string
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
    token_new: string
    token_hash_new: string
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let data: SendEmailHookPayload
  try {
    const wh = new Webhook(hookSecret)
    data = wh.verify(payload, headers) as SendEmailHookPayload
  } catch (err) {
    console.error('[send-email] Firma del hook inválida:', err)
    return new Response(JSON.stringify({ error: 'Firma inválida' }), { status: 401 })
  }

  const { user, email_data } = data
  const { token_hash, redirect_to, email_action_type, site_url } = email_data

  // Mismo link que arma internamente el template default de Supabase: GoTrue lo
  // resuelve en /auth/v1/verify, valida el token_hash, y redirige a redirect_to.
  const actionLink = `${site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  let subject: string
  let html: string

  if (email_action_type === 'recovery') {
    subject = 'Recuperá tu contraseña'
    html = await render(React.createElement(RecuperarPasswordEmail, { enlace: actionLink }))
  } else {
    // invite, signup, magiclink, email_change_* comparten el mismo template de
    // activación — ver el comentario en InviteEmail.tsx sobre por qué el copy es
    // genérico (sin nombre) acá.
    subject = '¡Bienvenido/a a la Plataforma de Elías Pacione!'
    html = await render(React.createElement(InviteEmail, { enlace: actionLink }))
  }

  const { error } = await resend.emails.send({
    from: REMITENTE,
    to: user.email,
    subject,
    html,
  })

  if (error) {
    console.error('[send-email] Error de Resend:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
