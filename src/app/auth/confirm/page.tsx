import { redirect } from 'next/navigation'
import { confirmarAcceso } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/BrandMark'

type Props = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>
}

// GET solo muestra este botón, nunca verifica el token — así un escaneo automático de
// links (Outlook/Microsoft Safe Links y similares hacen GET a cada link de un mail antes
// de que el usuario lo abra) no quema el token de un solo uso antes de que la persona
// llegue a tocarlo. La verificación real pasa recién en confirmarAcceso, disparada por un
// submit real del formulario (POST), algo que un escaneo pasivo no hace.
export default async function ConfirmarAccesoPage({ searchParams }: Props) {
  const { token_hash, type, next } = await searchParams

  if (!token_hash || !type) {
    redirect(`/login?message=${encodeURIComponent('El enlace es inválido o ha expirado.')}`)
  }

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

      <div className="relative z-10 w-full max-w-[420px]">
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
      </div>
    </div>
  )
}
