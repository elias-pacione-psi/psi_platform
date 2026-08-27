'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { iniciarCompraEbook, iniciarCompraEbookManual } from '@/app/ebooks/actions'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// `pagosHabilitados` lo calcula el server component que renderiza esto
// (mercadoPagoConfigurado(), en utils/mercadopago.ts) a partir de si existe
// MERCADOPAGO_ACCESS_TOKEN — nunca se chequea acá: ese valor es un secreto de servidor,
// no algo que deba viajar al bundle del cliente más que como el booleano ya resuelto.
//
// `linkPago` es el link de pago manual de ESTE ebook puntual (cargado a mano en el
// admin — columna ebooks.link_pago). Permite vender un libro sin depender de tener el
// token de la API configurado, con Mercado Pago, Ualá o lo que sea que devuelva un link.
//
// PRIORIDAD (invertida el 2026-08-28): manda el flujo automático cuando está
// configurado, y el link manual queda de reserva. Estaba al revés, y con un link cargado
// en cada ebook el flujo automático nunca llegaba a correr aunque estuviera disponible.
// El automático se confirma solo por webhook y entrega el PDF sin que nadie intervenga;
// el manual necesita que el psicólogo confirme el pago a mano. Cuando los dos están
// disponibles, el que no depende de un humano es estrictamente mejor.
//
// Los dos caminos piden el email primero y crean la orden ANTES de mandar a pagar: sin
// orden no hay forma de reconocer el pago después ni de entregar el PDF. Esa era la
// causa del bug del 2026-08-28 — el camino manual iba derecho al link, sin orden.
export function ComprarEbookButton(
  { ebookId, pagosHabilitados, linkPago }: { ebookId: string; pagosHabilitados: boolean; linkPago: string | null },
) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  const modo: 'automatico' | 'manual' | null =
    pagosHabilitados ? 'automatico' : linkPago ? 'manual' : null

  if (!modo) {
    return (
      <div className="space-y-3">
        <Button disabled className="w-full bg-tinta text-crema font-bold h-14 rounded-xl text-lg opacity-60 cursor-not-allowed">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Comprar — próximamente
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Todavía no habilitamos el pago online para este ebook.{' '}
          <Link href="/?interes=otro#contacto" className="text-marca underline underline-offset-2 hover:opacity-80">
            Escribinos
          </Link>{' '}
          y coordinamos el envío por otro medio.
        </p>
      </div>
    )
  }

  function handleComprar() {
    startTransition(async () => {
      if (modo === 'manual') {
        const res = await iniciarCompraEbookManual(ebookId, email)
        if ('error' in res) { toast.error(res.error); return }
        // Al pedido, NO al link de pago. La página del pedido es la que abre el pago en
        // una pestaña nueva: así esta pestaña —la única que sabe qué orden es esta— sigue
        // viva mientras la persona paga, y queda esperando la confirmación en vez de
        // quedar abandonada en la pantalla de "pago acreditado" de Mercado Pago, que no
        // tiene forma de volver acá.
        window.location.href = `/pedido/${res.ordenId}`
        return
      }

      const res = await iniciarCompraEbook(ebookId, email)
      if ('error' in res) { toast.error(res.error); return }
      // Salida completa del sitio, no un router.push: init_point es un dominio de
      // Mercado Pago, no una ruta interna.
      window.location.href = res.url
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="w-full bg-tinta hover:bg-marca text-crema font-bold h-14 rounded-xl text-lg">
        <ShoppingCart className="w-5 h-5 mr-2" />
        Comprar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-tinta">¿A qué email te lo mandamos?</DialogTitle>
            <DialogDescription className="font-sans">
              {modo === 'manual'
                ? 'Te lo habilitamos ahí apenas confirmemos el pago, y te avisamos por mail. No hace falta crear una cuenta para comprar.'
                : 'Ahí vas a poder descargarlo apenas se acredite el pago. No hace falta crear una cuenta para comprar.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-compra" className="font-bold text-tinta">Email</Label>
              <Input
                id="email-compra" type="email" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="vos@ejemplo.com" className="bg-card border-border"
                disabled={isPending}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComprar() }}
              />
            </div>
            <Button
              onClick={handleComprar}
              disabled={isPending || !email.trim()}
              className="w-full bg-marca hover:bg-marca/90 text-crema font-bold h-12 rounded-xl"
            >
              {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Ir a pagar
            </Button>

            {/* Dos cosas tienen que pasar acá y no en el pie de la home:
                  1. Los términos dicen que comprar implica aceptarlos (punto 2), y el
                     art. 4 de la Ley 24.240 exige que estén a la vista ANTES de pagar.
                  2. La salvedad del punto 9 sobre contenido digital ya descargado sólo
                     se sostiene si el comprador prestó "conformidad previa y expresa"
                     al acceso inmediato. Este es el único momento en que se puede
                     tomar esa conformidad: si se saca de acá, hay que sacar también la
                     salvedad del punto 9 de /terminos. */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Al continuar aceptás los{' '}
              <Link href="/terminos" className="underline underline-offset-2 hover:text-tinta">
                términos y condiciones
              </Link>{' '}
              y la{' '}
              <Link href="/privacidad" className="underline underline-offset-2 hover:text-tinta">
                política de privacidad
              </Link>
              , y pedís expresamente acceder al ebook apenas se acredite el pago. Tenés
              10 días corridos para arrepentirte; sobre el contenido que ya hayas
              descargado rige la salvedad del punto 9 de los términos.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
