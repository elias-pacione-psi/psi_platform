"use client";

import { useState, useTransition } from "react";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { restaurarCredenciales } from '../actions'

// Lo usan las fichas de Alumnos y de Pacientes: es la misma persona, la misma tabla y la
// misma action, así que el diálogo es uno solo.
//
// Pide escribir el nombre igual que "Eliminar definitivamente": acá también se borra todo
// lo de la persona sin vuelta atrás, y un clic suelto en el menú no debería alcanzar.
export function RestaurarCredencialesDialog({
  persona,
  open,
  onOpenChange,
}: {
  persona: { id: string, nombre: string, email: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleOpenChange = (abierto: boolean) => {
    // Mientras corre no se cierra: la action tarda (borra archivos y manda el mail) y
    // cerrar a mitad dejaría al psicólogo sin saber si terminó.
    if (isPending) return
    onOpenChange(abierto)
    if (!abierto) setTexto('')
  }

  const handleRestaurar = () => {
    startTransition(async () => {
      try {
        const result = await restaurarCredenciales(persona.id)
        if (result?.error) {
          toast.error(result.error, { duration: 12000 })
        } else {
          onOpenChange(false)
          setTexto('')
          toast.success(`Listo: se borraron los datos de ${persona.nombre} y se le mandó un mail a ${result.email} para crear el acceso de nuevo.`)
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(err.message || 'Error inesperado')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-orange-700 dark:text-orange-400 font-serif text-2xl">Restaurar credenciales</AlertDialogTitle>
          <AlertDialogDescription className="font-sans">
            Esto borra de forma <strong>irreversible</strong> todo lo de <strong>{persona.nombre}</strong>: programas
            asignados, progreso, quizzes, entregas (con sus archivos), agenda, formaciones y material. Después le llega un
            mail a <strong>{persona.email}</strong> para crear su acceso de cero.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground font-sans">
          Se conservan su nombre, email, teléfono y link de videollamada, y las compras de ebooks que hizo con ese email.
          Mientras no use el link del mail, no puede entrar.
        </p>
        <div className="space-y-2">
          <Label className="font-sans text-sm text-tinta">Para confirmar, escribí el nombre: <strong>{persona.nombre}</strong></Label>
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={persona.nombre}
            className="bg-card border-border"
            disabled={isPending}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            onClick={handleRestaurar}
            disabled={isPending || texto.trim() !== persona.nombre}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Borrar todo y mandar mail'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
