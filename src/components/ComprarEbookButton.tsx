'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'

// Fase 2 del modelo comercial (docs/plan-modelo-comercial.md): la vidriera de ebooks ya
// está armada, pero el cobro (Mercado Pago) es una fase aparte — necesita credenciales
// que todavía no existen. Este componente es el lugar donde va a enganchar ese circuito:
// por ahora ofrece el único camino que sí funciona hoy (coordinar por Consultas), y
// cuando llegue el checkout real se reemplaza su contenido sin tocar la página de detalle
// que lo usa — ese día vuelve a recibir el ebook (id, slug, precio) como prop.
export function ComprarEbookButton() {
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
