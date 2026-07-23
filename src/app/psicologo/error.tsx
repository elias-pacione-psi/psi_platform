'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <h2 className="text-2xl font-bold font-heading text-tinta mb-4">Ocurrió un error en el panel</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Algo salió mal al procesar esta vista de administrador. Puedes intentar cargar de nuevo.
      </p>
      <Button
        onClick={() => reset()}
        className="bg-marca hover:bg-marca/90 text-white"
      >
        Reintentar
      </Button>
    </div>
  )
}
