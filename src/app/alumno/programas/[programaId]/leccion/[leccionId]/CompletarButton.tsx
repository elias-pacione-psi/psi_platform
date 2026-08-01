'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { marcarLeccionCompletada } from '@/app/alumno/actions'
import { toast } from 'sonner'

export function CompletarButton({ leccionId, programaId, completadoInicial }: { leccionId: string, programaId: string, completadoInicial: boolean }) {
  const [completado, setCompletado] = useState(completadoInicial)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const nuevo = !completado
    setCompletado(nuevo) // optimista
    startTransition(async () => {
      const result = await marcarLeccionCompletada(leccionId, programaId, nuevo)
      if (result?.error) { setCompletado(!nuevo); toast.error(result.error) }
      else toast.success(nuevo ? '¡Lección completada!' : 'Marcada como pendiente')
    })
  }

  return (
    <Button
      onClick={toggle}
      disabled={isPending}
      className={completado
        ? 'bg-marca hover:bg-marca/90 text-crema h-12 px-8 rounded-xl'
        : 'bg-card border-2 border-marca text-marca hover:bg-marca hover:text-crema h-12 px-8 rounded-xl'}
    >
      {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : completado ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Circle className="w-5 h-5 mr-2" />}
      {completado ? 'Lección completada' : 'Marcar como completada'}
    </Button>
  )
}
