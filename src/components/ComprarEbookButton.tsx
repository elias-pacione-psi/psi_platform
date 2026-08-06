'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { iniciarCompraEbook } from '@/app/ebooks/actions'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// `pagosHabilitados` lo calcula el server component que renderiza esto
// (mercadoPagoConfigurado(), en utils/mercadopago.ts) a partir de si existe
// MERCADOPAGO_ACCESS_TOKEN — nunca se chequea acá: ese valor es un secreto de servidor,
// no algo que deba viajar al bundle del cliente más que como el booleano ya resuelto.
// TEMPORAL — solo para previsualizar cómo se siente el checkout de Mercado Pago.
// Este link fijo (creado a mano en el dashboard de MP) NO está conectado a
// `iniciarCompraEbook`: no crea orden, no dispara el webhook y no habilita
// la descarga. Sacar esta constante y el bloque que la usa antes de activar
// el flujo real (que ya existe más abajo, gateado por `pagosHabilitados`).
const LINK_PREVIEW_MP = 'https://mpago.la/2CgXKwA'

export function ComprarEbookButton({ ebookId, pagosHabilitados }: { ebookId: string; pagosHabilitados: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()

  if (!pagosHabilitados) {
    return (
      <div className="space-y-3">
        <Button
          onClick={() => { window.location.href = LINK_PREVIEW_MP }}
          className="w-full bg-tinta hover:bg-marca text-crema font-bold h-14 rounded-xl text-lg"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Comprar
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          (Preview: este botón usa un link de prueba de Mercado Pago, no está conectado a la compra real todavía.)
        </p>
      </div>
    )
  }

  function handleComprar() {
    startTransition(async () => {
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
              Ahí vas a poder descargarlo apenas se acredite el pago. No hace falta crear una cuenta para comprar.
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
