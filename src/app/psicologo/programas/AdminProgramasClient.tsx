'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { guardarPrograma, eliminarPrograma } from '../actions'
import { Loader2, Settings2, Plus, ArrowRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminProgramasClient({ programas }: { programas: any[] }) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPrograma, setSelectedPrograma] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [programaToDelete, setProgramaToDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModal = (programa: any = null) => {
    setSelectedPrograma(programa)
    setOpen(true)
    setErrorMsg(null)
  }

  async function handleSubmit(formData: FormData) {
    setErrorMsg(null)

    startTransition(async () => {
      const result = await guardarPrograma(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  async function handleDelete() {
    if (!programaToDelete) return
    startTransition(async () => {
      const result = await eliminarPrograma(programaToDelete)
      if (result?.error) {
        toast.error(`Error al eliminar: ${result.error}`)
      } else {
        toast.success("Programa eliminado con éxito.")
        setProgramaToDelete(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-heading font-bold text-tinta">Programas</h1>
          <p className="text-muted-foreground mt-2 font-sans">Carpetas temáticas de contenido para asignar a tus pacientes.</p>
        </div>
        <Button onClick={() => openModal(null)} className="bg-marca hover:bg-marca/90 text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Crear programa
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-heading font-semibold text-tinta">Título</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Actividades</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No hay programas creados aún.</TableCell>
              </TableRow>
            ) : programas.map((programa) => (
              <TableRow key={programa.id}>
                <TableCell className="font-medium text-tinta max-w-[300px] truncate">{programa.titulo}</TableCell>
                <TableCell>{programa.cantidad_actividades}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openModal(programa)} className="font-sans">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="default" size="sm" onClick={() => router.push(`/psicologo/programas/${programa.id}`)} className="font-sans bg-tinta hover:bg-tinta/90">
                    Contenido
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setProgramaToDelete(programa.id)} className="font-sans text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" disabled={isPending}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">
              {selectedPrograma ? 'Editar programa' : 'Crear nuevo programa'}
            </DialogTitle>
            <DialogDescription className="font-sans">
              Configurá los detalles básicos de este bloque de contenido.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4 mt-4">
            {selectedPrograma && <input type="hidden" name="id" value={selectedPrograma.id} />}

            <div className="space-y-2">
              <Label htmlFor="titulo" className="font-bold text-tinta">Título del programa</Label>
              <Input id="titulo" name="titulo" defaultValue={selectedPrograma?.titulo || ''} placeholder="Ej: Manejo de la ansiedad" className="bg-white border-gray-200" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="font-bold text-tinta">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                defaultValue={selectedPrograma?.descripcion || ''}
                className="bg-white border-gray-200 h-24 resize-none"
              />
            </div>

            {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-white px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar programa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!programaToDelete} onOpenChange={(isOpen) => !isOpen && setProgramaToDelete(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Eliminar este programa?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Esta acción no se puede deshacer. Eliminará permanentemente el programa y <b>todas</b> las unidades y actividades (materiales) que contiene.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="font-sans">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white font-sans">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
