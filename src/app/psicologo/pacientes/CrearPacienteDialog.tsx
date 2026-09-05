'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { crearPacienteDirecto } from './actions'

// Mismos campos que Crear alumno menos los programas: a un paciente no se le asigna
// contenido de cursos. El material puntual se entrega después, desde la fila del
// paciente ("Entregar material"). Nada de campos clínicos acá — ver AGENTS.md.
export function CrearPacienteDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await crearPacienteDirecto(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        toast.success('Paciente creado. Se le envió un email para configurar su contraseña.')
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrorMsg(null) }}>
      <DialogTrigger render={
        <Button className="bg-marca hover:bg-marca/90 text-crema font-sans">
          <UserPlus className="w-4 h-4 mr-2" />
          Crear paciente
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-crema">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-tinta">Crear nuevo paciente</DialogTitle>
          <DialogDescription className="font-sans">
            Cargá los datos de contacto. Se enviará una invitación por email para que
            configure su contraseña y pueda ver su agenda y su material.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nuevo-paciente-nombre" className="font-bold text-tinta">Nombre del paciente *</Label>
              <Input id="nuevo-paciente-nombre" name="nombre" className="bg-card border-border" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-paciente-email" className="font-bold text-tinta">Correo electrónico *</Label>
              <Input id="nuevo-paciente-email" name="email" type="email" className="bg-card border-border" placeholder="paciente@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-paciente-telefono" className="font-bold text-tinta">Teléfono / WhatsApp</Label>
              <Input id="nuevo-paciente-telefono" name="telefono" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-paciente-link" className="font-bold text-tinta">Link de videollamada</Label>
              <Input id="nuevo-paciente-link" name="link_videollamada" className="bg-card border-border" placeholder="https://meet.google.com/... o Zoom" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            El link de videollamada es el que se usa por defecto en las sesiones virtuales
            de esta persona, salvo que la sesión traiga uno propio.
          </p>

          {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema w-full sm:w-auto px-8">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear e invitar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
