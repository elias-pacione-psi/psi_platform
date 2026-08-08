import Link from 'next/link'
import { confirmarAcceso } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'

type Props = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string; error?: string }>
}

// Mismas clases que el <Button> de abajo: este Button es de base-ui (no radix), así que
// no tiene `asChild` para renderizar un <Link> con su estilo.
const CLASES_BOTON =
  'w-full inline-flex items-center justify-center bg-marca hover:bg-marca/90 text-crema font-sans text-md h-12 rounded-lg shadow-md shadow-marca/25 transition-colors'

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-1 items-center justify-center min-h-screen bg-noche overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-32 w-[60rem] h-[34rem] opacity-[0.09] bg-no-repeat bg-cover"
        style={{
          backgroundImage: 'url(/brand/leaf-shadow.png)',
          WebkitMaskImage: 'radial-gradient(ellipse at 28% 30%, #000 30%, transparent 68%)',
          maskImage: 'radial-gradient(ellipse at 28% 30%, #000 30%, transparent 68%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
    </div>
  )
}

// GET solo muestra este botón, nunca verifica el token — así un escaneo automático de
// links (Outlook/Microsoft Safe Links y similares hacen GET a cada link de un mail antes
// de que el usuario lo abra) no quema el token de un solo uso antes de que la persona
// llegue a tocarlo. La verificación real pasa recién en confirmarAcceso, disparada por un
// submit real del formulario (POST), algo que un escaneo pasivo no hace.
export default async function ConfirmarAccesoPage({ searchParams }: Props) {
  const { token_hash, type, next, error } = await searchParams

  // Enlace vencido, ya usado, o entrada directa sin parámetros. Se resuelve ACÁ y no
  // rebotando a /login: el caso típico es alguien recién invitado, cuya cuenta ya existe
  // pero todavía NO tiene contraseña — mandarlo a un formulario de login es un callejón
  // sin salida. Encima /login es un componente cliente que nunca leyó el ?message= que se
  // le pasaba, así que el motivo se perdía en el camino y la persona quedaba frente a un
  // login pelado sin entender qué falló. El enlace nuevo sale por /recuperar-contrasena,
  // que sirve igual para una cuenta sin contraseña previa (resetPasswordForEmail no exige
  // que haya una).
  if (error || !token_hash || !type) {
    return (
      <Marco>
        <Card className="bg-card border-none rounded-2xl shadow-2xl shadow-black/30">
          <CardHeader className="text-center pb-2">
            <BrandMark className="w-16 h-11 mx-auto mb-4 text-tinta" />
            <CardTitle className="text-2xl font-heading font-semibold tracking-tight text-tinta">
              Este enlace ya no sirve
            </CardTitle>
            <CardDescription className="font-serif text-muted-foreground mt-2">
              Puede que ya lo hayas usado, o que haya pasado demasiado tiempo desde que te
              llegó. Pedí uno nuevo con tu email y seguí desde ahí.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-4 flex flex-col gap-3">
            <Link href="/recuperar-contrasena" className={CLASES_BOTON}>
              Pedir un enlace nuevo
            </Link>
            <Link
              href="/login"
              className="text-center text-sm font-sans text-muted-foreground hover:text-tinta transition-colors"
            >
              Ya tengo contraseña, quiero entrar
            </Link>
          </CardContent>
        </Card>
      </Marco>
    )
  }

  return (
    <Marco>
      <Card className="bg-card border-none rounded-2xl shadow-2xl shadow-black/30">
        <CardHeader className="text-center pb-2">
          <BrandMark className="w-16 h-11 mx-auto mb-4 text-tinta" />
          <CardTitle className="text-2xl font-heading font-semibold tracking-tight text-tinta">Confirmá tu acceso</CardTitle>
          <CardDescription className="font-serif text-muted-foreground mt-2">
            Por seguridad, confirmá manualmente para activar tu enlace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={confirmarAcceso} className="mt-4">
            <input type="hidden" name="token_hash" value={token_hash} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={next ?? ''} />
            <Button type="submit" className="w-full bg-marca hover:bg-marca/90 text-crema font-sans text-md h-12 rounded-lg shadow-md shadow-marca/25">
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </Marco>
  )
}
