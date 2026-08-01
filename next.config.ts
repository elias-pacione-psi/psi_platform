import type { NextConfig } from "next";

// Cabeceras de seguridad. La CSP es la segunda línea de defensa detrás de la validación
// de dominios en las server actions: aunque se cuele una URL hostil en un material,
// el navegador no la deja embeber ni deja que la página mande datos a otro host.
// 'unsafe-inline'/'unsafe-eval' en script-src siguen siendo necesarios para el runtime de Next.
const esDev = process.env.NODE_ENV === 'development'
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

// R2 es privado (URLs firmadas, no el "public dev url" pub-*.r2.dev de Cloudflare):
// el host real es el endpoint de la API de S3, específico de la cuenta. Si todavía
// no se cargó R2_ACCOUNT_ID en .env.local, esto queda vacío y el resto de la CSP
// sigue funcionando igual (Drive/Dropbox/Supabase no dependen de esto).
const r2AccountId = process.env.R2_ACCOUNT_ID ?? ''
const r2Host = r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : ''

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // Los videos/audios de buckets privados llegan como URL firmada (Supabase o R2)
  `media-src 'self' blob: ${supabaseHost} ${r2Host}`,
  // date.nager.at: feriados de Argentina en el calendario (src/app/calendarActions.ts).
  // r2Host también en connect-src: el navegador sube directo a R2 con un PUT a la
  // URL presignada (src/utils/r2.ts), sin pasar por nuestro servidor.
  `connect-src 'self' ${supabaseHost} ${r2Host} https://date.nager.at${esDev ? ' ws: wss:' : ''}`,
  // Espejo de HOSTS_DRIVE / HOSTS_DROPBOX en src/app/psicologo/actions.ts: si se
  // agrega un proveedor de materiales allá, hay que agregarlo acá también o el
  // navegador bloquea el iframe aunque la validación del servidor lo acepte.
  `frame-src 'self' blob: ${supabaseHost} ${r2Host} https://drive.google.com https://docs.google.com https://www.dropbox.com https://dropbox.com https://dl.dropboxusercontent.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // El portal nunca se embebe: es material de pacientes, no un widget público.
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
