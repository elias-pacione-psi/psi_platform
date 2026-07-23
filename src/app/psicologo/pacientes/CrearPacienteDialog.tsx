'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { crearPacienteDirecto } from '../actions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CrearPacienteDialog({ todosLosProgramas }: { todosLosProgramas: any[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [selectedProgramas, setSelectedProgramas] = useState<string[]>([])

  const togglePrograma = (id: string, checked: boolean) => {
    setSelectedProgramas(prev => checked ? [...prev, id] : prev.filter(m => m !== id))
  }

  const handleSubmit = (formData: FormData) => {
    setErrorMsg(null)
    selectedProgramas.forEach(id => formData.append('programas', id))
    startTransition(async () => {
      const result = await crearPacienteDirecto(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        toast.success('Paciente creado. Se le envió un email para configurar su contraseña.')
        setSelectedProgramas([])
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrorMsg(null) }}>
      <DialogTrigger render={
        <Button className="bg-marca hover:bg-marca/90 text-white font-sans">
          <UserPlus className="w-4 h-4 mr-2" />
          Crear paciente
        </Button>
      } />
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-crema">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-tinta">Crear nuevo paciente</DialogTitle>
          <DialogDescription className="font-sans">
            Cargá los datos y asignale programas si querés. Se enviará una invitación por email para que configure su contraseña.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nuevo-nombre" className="font-bold text-tinta">Nombre del paciente *</Label>
              <Input id="nuevo-nombre" name="nombre" className="bg-white border-gray-200" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-email" className="font-bold text-tinta">Correo electrónico *</Label>
              <Input id="nuevo-email" name="email" type="email" className="bg-white border-gray-200" placeholder="paciente@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-telefono" className="font-bold text-tinta">Teléfono / WhatsApp</Label>
              <Input id="nuevo-telefono" name="telefono" className="bg-white border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nuevo-link_videollamada" className="font-bold text-tinta">Link de videollamada</Label>
              <Input id="nuevo-link_videollamada" name="link_videollamada" className="bg-white border-gray-200" placeholder="https://meet.google.com/... o Zoom" />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Label className="font-bold text-tinta block">Programas asignados (opcional)</Label>
            <div className="grid gap-3 max-h-[200px] overflow-y-auto p-2 bg-white rounded-xl border border-gray-200">
              {todosLosProgramas.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No hay programas creados todavía.</p>
              )}
              {todosLosProgramas.map((programa) => (
                <div key={programa.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <Checkbox
                    id={`nuevo-programa-${programa.id}`}
                    checked={selectedProgramas.includes(programa.id)}
                    onCheckedChange={(checked) => togglePrograma(programa.id, checked as boolean)}
                  />
                  <div className="grid leading-none cursor-pointer" onClick={() => togglePrograma(programa.id, !selectedProgramas.includes(programa.id))}>
                    <label className="text-sm font-medium leading-none text-tinta">{programa.titulo}</label>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{programa.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-white w-full sm:w-auto px-8">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear e invitar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
