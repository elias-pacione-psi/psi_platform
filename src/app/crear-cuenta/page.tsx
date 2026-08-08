import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { CrearCuentaClient } from './CrearCuentaClient'

export const metadata = { title: 'Creá tu cuenta | Elias Pacione' }

type Props = { searchParams: Promise<{ orden?: string }> }

// Público, pero NO es un registro abierto. Hacen falta dos cosas para dar de alta acá, y
// las dos se validan de nuevo server-side en crearCuentaComprador():
//
//   1. una orden 'pagada' sin cuenta asociada, y
//   2. tener el id de esa orden.
//
// El (2) es lo que impide el pre-hijacking: sin él, saber el email de un comprador
// alcanzaba para crear su cuenta con una contraseña ajena y bajarse el PDF que pagó. El
// id de la orden sólo lo tiene quien volvió del checkout (es la URL /pedido/[id]).
//
// El email se resuelve acá desde ese id en vez de venir en el query string: mandarlo por
// URL lo deja en el historial del navegador, en los logs del server y en el Referer.
export default async function CrearCuentaPage({ searchParams }: Props) {
  const { orden } = await searchParams

  let emailInicial = ''
  if (orden) {
    const supabaseAdmin = createAdminClient()
    const { data } = await supabaseAdmin
      .from('ordenes')
      .select('email_comprador')
      .eq('id', orden)
      .eq('estado', 'pagada')
      .is('alumno_id', null)
      .maybeSingle()
    emailInicial = data?.email_comprador ?? ''
  }

  // Sin una orden que habilite el alta no se muestra el formulario: completarlo sería
  // perder el tiempo (la action lo rechaza igual) y además invitaría a probar emails
  // ajenos. Mejor decir de dónde sale el enlace correcto.
  if (!emailInicial) {
    return (
      <div className="min-h-screen bg-crema flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <h1 className="text-2xl font-heading font-bold text-tinta">Creá tu cuenta desde tu compra</h1>
            <p className="text-muted-foreground">
              La cuenta se crea desde la página de confirmación de tu compra — es el enlace
              al que te llevó Mercado Pago cuando terminaste de pagar, y el que te llegó por
              email.
            </p>
            <p className="text-sm text-muted-foreground">
              Si ya tenés cuenta,{' '}
              <Link href="/login" className="text-marca underline underline-offset-2">ingresá acá</Link>.
              ¿No encontrás el enlace? Escribinos desde{' '}
              <Link href="/#consultas" className="text-marca underline underline-offset-2">Consultas</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <CrearCuentaClient emailInicial={emailInicial} ordenId={orden ?? ''} />
}
