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

  // Todo lo de acá para abajo (render de React Email + Resend) va en un try/catch
  // propio: sin esto, cualquier excepción no capturada (por ejemplo un fallo al
  // renderizar el JSX en el runtime de Edge Functions) la envuelve el runtime en un 500
  // genérico con el body "Internal Server Error" — sin mensaje, sin forma de diagnosticar
  // sin acceso a los logs del Dashboard. Con el catch, al menos queda en la respuesta y
  // en console.error (que si el Dashboard tiene logging habilitado, sí se puede ver ahí).
  try {
    const { user, email_data } = data
    const { token_hash, redirect_to, email_action_type } = email_data

    // Mismo link que arma internamente el template default de Supabase: GoTrue lo
    // resuelve en /auth/v1/verify, valida el token_hash, y redirige a redirect_to.
    // Base URL: Deno.env.get('SUPABASE_URL'), NO email_data.site_url — este último ya
    // trae /auth/v1 incluido en este proyecto, y concatenarle /auth/v1/verify de nuevo
    // arma /auth/v1/auth/v1/verify, que Kong no matchea contra la ruta de GoTrue y cae
    // al fallback de PostgREST ("No API key found in request"). SUPABASE_URL es la base
    // limpia (sin path), la inyecta Supabase sola en cada Edge Function. El apikey
    // (SUPABASE_ANON_KEY, pública) queda igual por las dudas — no hace daño tenerlo.
    const actionLink = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}&apikey=${Deno.env.get('SUPABASE_ANON_KEY')}`

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
  } catch (err) {
    console.error('[send-email] Excepción no capturada:', err)
    const mensaje = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return new Response(JSON.stringify({ error: mensaje, stack: err instanceof Error ? err.stack : undefined }), { status: 500 })
  }
})
