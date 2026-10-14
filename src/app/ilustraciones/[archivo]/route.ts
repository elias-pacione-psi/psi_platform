import type { NextRequest } from 'next/server'
import { ILUSTRACIONES, keyIlustracion, type SlugIlustracion, type TemaIlustracion } from '@/utils/ilustraciones'
import { leerTextoR2, r2Configurado } from '@/utils/r2'

// Sirve las ilustraciones de las páginas públicas (/ilustraciones/<slug>-<claro|oscuro>.svg)
// leyéndolas del bucket de R2. Ver utils/ilustraciones.ts para el porqué: una URL firmada
// vence, y estas imágenes viven en páginas estáticas que pueden servirse viejas.
//
// No pasa por proxy.ts: su matcher deja afuera las rutas que terminan en .svg, así que no
// hay sesión ni consulta a Supabase de por medio — y no tiene por qué haberlas, es contenido
// de marca igual que el resto de la web pública.
const NOMBRE = /^([a-z0-9-]+)-(claro|oscuro)\.svg$/

// `v` (el ETag que agrega urlIlustracion) hace que cada versión del archivo tenga su propia
// URL, así que con `v` la respuesta se puede cachear sin vencimiento. Sin `v` —alguien que
// abre la imagen a mano— se cachea poco, para que un reemplazo se note enseguida.
const VERSION_VALIDA = /^[A-Za-z0-9_-]{1,80}$/
const CACHE_VERSIONADA = 'public, max-age=31536000, immutable'
const CACHE_SIN_VERSION = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'

// La CSP estricta para estos SVG se pone en next.config.ts (una cabecera puesta desde acá
// la pisa la regla general de allá).

export async function GET(request: NextRequest, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params
  const partes = NOMBRE.exec(archivo)
  // Solo los slugs de ILUSTRACIONES: la key del bucket sale de acá, nunca del pedido tal cual.
  if (!partes || !Object.hasOwn(ILUSTRACIONES, partes[1])) {
    return new Response('No encontrada', { status: 404 })
  }
  if (!r2Configurado()) {
    return new Response('Sin almacenamiento', { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }

  const key = keyIlustracion(partes[1] as SlugIlustracion, partes[2] as TemaIlustracion)
  let svg: string | null
  try {
    svg = await leerTextoR2(key)
  } catch (err) {
    console.error('No se pudo leer la ilustración', key, err instanceof Error ? err.message : err)
    return new Response('No disponible', { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
  if (svg === null) return new Response('No encontrada', { status: 404, headers: { 'Cache-Control': 'no-store' } })

  const version = request.nextUrl.searchParams.get('v')
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': version && VERSION_VALIDA.test(version) ? CACHE_VERSIONADA : CACHE_SIN_VERSION,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
