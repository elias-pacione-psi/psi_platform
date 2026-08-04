import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // '/' se compara exacto: con startsWith('/') toda ruta sería pública y el guard nunca redirigiría.
  // '/ebooks' es la vidriera pública (fase 2 del modelo comercial): sin esto, cualquiera sin
  // sesión que entrara a comprar rebotaba a /login antes de ver el catálogo.
  const publicRoutes = [
    '/login', '/recuperar-contrasena', '/auth/confirm', '/configurar-password',
    '/privacidad', '/terminos', '/arrepentimiento', '/ebooks', '/pedido', '/crear-cuenta',
    // El webhook de Mercado Pago (api/webhooks/mercadopago) lo llama el servidor de
    // Mercado Pago, sin ninguna sesión de esta app — la propia ruta valida la firma de
    // la notificación, así que redirigirla a /login antes de que corra ese código sería
    // el mismo tipo de bug que ya apareció con /ebooks, /terminos y /arrepentimiento.
    '/api',
  ]
  const esRutaPublica = request.nextUrl.pathname === '/'
    || publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
