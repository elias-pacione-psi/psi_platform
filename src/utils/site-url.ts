import 'server-only'

// URL base para armar links absolutos desde el servidor. NEXT_PUBLIC_SITE_URL manda
// (así se fuerza localhost en dev vía .env.local); si no está seteada, se asume
// producción directamente — nada de VERCEL_URL: ese system env var no solo depende de
// un toggle de Vercel que puede estar apagado (y en ese caso queda undefined), sino que
// aunque esté prendido apunta al subdominio *.vercel.app, no al dominio propio, así que
// nunca fue una red de seguridad real. Vivía duplicada en psicologo/actions.ts (para el
// redirect de invitación) antes de que el checkout de Mercado Pago necesitara la misma
// cuenta para back_urls/notification_url.
export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://eliaspacione.com'
}
