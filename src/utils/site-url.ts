import 'server-only'

// URL base para armar links absolutos desde el servidor: localhost en dev,
// VERCEL_URL/SITE_URL en producción. Vivía duplicada en psicologo/actions.ts (para el
// redirect de invitación) antes de que el checkout de Mercado Pago necesitara la misma
// cuenta para back_urls/notification_url.
export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}
