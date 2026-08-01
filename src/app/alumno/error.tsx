'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <h2 className="text-2xl font-bold font-heading text-tinta mb-4">Ocurrió un error inesperado</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Lo sentimos, tuvimos un problema al cargar esta página. Puedes intentar de nuevo.
      </p>
      <Button
        onClick={() => reset()}
        className="bg-marca hover:bg-marca/90 text-crema"
      >
        Reintentar
      </Button>
    </div>
  )
}
