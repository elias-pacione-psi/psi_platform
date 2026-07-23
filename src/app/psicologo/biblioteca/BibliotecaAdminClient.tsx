"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Trash2, FileText, FileVideo, FileAudio, ExternalLink, Library, Users } from 'lucide-react'
import { toast } from 'sonner'
import { crearRecursoBiblioteca, eliminarRecursoBiblioteca, asignarRecursoBiblioteca } from '../actions'
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from '@/utils/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BibliotecaAdminClient({ recursos, pacientes }: { recursos: any[], pacientes: any[] }) {
  const [open, setOpen] = useState(false)
  const [openAssign, setOpenAssign] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRecurso, setSelectedRecurso] = useState<any>(null)
  const [selectedPacienteIds, setSelectedPacienteIds] = useState<string[]>([])
  const [pacienteSearch, setPacienteSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [tipoContenido, setTipoContenido] = useState('drive_pdf')
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleCrear = async (formData: FormData) => {
    startTransition(async () => {
      try {
        if (tipoContenido.startsWith('supabase_') && fileToUpload) {
          setUploading(true)
          const supabase = createClient()
          const fileExt = fileToUpload.name.split('.').pop()
          const fileName = `biblioteca/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`
          // Bucket privado: el paciente lo verá vía URL firmada generada en el servidor
          const { error } = await supabase.storage.from('materiales').upload(fileName, fileToUpload)

          if (error) {
            toast.error(`Error al subir archivo: ${error.message}`)
            setUploading(false)
            return
          }

          formData.set('url_recurso', fileName)
          setUploading(false)
        }

        const result = await crearRecursoBiblioteca(formData)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Recurso añadido a la biblioteca")
          setOpen(false)
          setFileToUpload(null)
          setTipoContenido('drive_pdf')
        }
      } catch {
        toast.error("Error al crear recurso")
        setUploading(false)
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openAssignModal = (recurso: any) => {
    setSelectedRecurso(recurso)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentAssignments = recurso.recursos_asignados?.map((a: any) => a.paciente_id) || []
    setSelectedPacienteIds(currentAssignments)
    setPacienteSearch('')
    setOpenAssign(true)
  }

  const handleTogglePaciente = (pacienteId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPacienteIds([...selectedPacienteIds, pacienteId])
    } else {
      setSelectedPacienteIds(selectedPacienteIds.filter(id => id !== pacienteId))
    }
  }

  const handleAssign = () => {
    if (!selectedRecurso) return;

    startTransition(async () => {
      try {
        const result = await asignarRecursoBiblioteca(selectedRecurso.id, selectedPacienteIds)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Accesos actualizados")
          setOpenAssign(false)
        }
      } catch {
        toast.error("Error al actualizar accesos")
      }
    })
  }

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que querés eliminar este recurso?")) return;

    startTransition(async () => {
      try {
        const result = await eliminarRecursoBiblioteca(id)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success("Recurso eliminado")
        }
      } catch {
        toast.error("Error al eliminar")
      }
    })
  }

  const getIcon = (tipo: string) => {
    if (tipo.includes('video')) return <FileVideo className="w-4 h-4 text-blue-600" />;
    if (tipo.includes('audio')) return <FileAudio className="w-4 h-4 text-purple-600" />;
    if (tipo.includes('pdf')) return <FileText className="w-4 h-4 text-marca" />;
    return <ExternalLink className="w-4 h-4 text-gray-600" />;
  }

  const [searchTerm, setSearchTerm] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredRecursos = recursos.filter((r: any) =>
    r.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Input
          placeholder="Buscar recurso por título..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md bg-white"
        />
        <Button onClick={() => setOpen(true)} className="bg-marca hover:bg-marca/90 text-white font-bold rounded-xl h-11 px-6 shadow-sm shrink-0">
          <Plus className="mr-2 h-5 w-5" /> Añadir material
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Nuevo recurso</DialogTitle>
            <DialogDescription>
              Después de crearlo, asignalo a los pacientes que corresponda con el botón de accesos.
            </DialogDescription>
          </DialogHeader>

          <form action={handleCrear} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="titulo" className="font-bold text-tinta">Título del material</Label>
              <Input id="titulo" name="titulo" required className="bg-white" placeholder="Ej: Guía de respiración diafragmática" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_contenido" className="font-bold text-tinta">Tipo de contenido</Label>
              <Select name="tipo_contenido" required value={tipoContenido} onValueChange={(val) => setTipoContenido(val || 'drive_pdf')}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccioná el formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drive_pdf">Documento / PDF (Google Drive)</SelectItem>
                  <SelectItem value="drive_video">Video (Google Drive)</SelectItem>
                  <SelectItem value="drive_audio">Audio (Google Drive)</SelectItem>
                  <SelectItem value="dropbox_pdf">PDF (Dropbox)</SelectItem>
                  <SelectItem value="dropbox_video">Video (Dropbox)</SelectItem>
                  <SelectItem value="dropbox_audio">Audio (Dropbox)</SelectItem>
                  <SelectItem value="supabase_pdf">PDF (Subir archivo)</SelectItem>
                  <SelectItem value="supabase_video">Video (Subir archivo)</SelectItem>
                  <SelectItem value="supabase_audio">Audio (Subir archivo)</SelectItem>
                  <SelectItem value="enlace_externo">Enlace externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_recurso" className="font-bold text-tinta">
                {tipoContenido.startsWith('supabase_') ? 'Seleccionar archivo' : 'Enlace del recurso'}
              </Label>
              {tipoContenido.startsWith('supabase_') ? (
                <Input
                  id="archivo_supabase"
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="bg-white border-gray-200 cursor-pointer"
                  accept={tipoContenido.includes('video') ? 'video/*' : tipoContenido.includes('audio') ? 'audio/*' : '.pdf'}
                  required
                />
              ) : (
                <Input id="url_recurso" name="url_recurso" type="url" required className="bg-white" placeholder="https://..." />
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isPending || uploading} className="bg-tinta hover:bg-tinta/90 text-white w-full sm:w-auto px-8">
                {isPending || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar recurso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredRecursos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Library className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-tinta">Sin resultados</h3>
            <p className="text-muted-foreground mt-1">Subí materiales de apoyo para tus pacientes, o probá otra búsqueda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold text-tinta">Título</TableHead>
                <TableHead className="font-bold text-tinta">Formato</TableHead>
                <TableHead className="font-bold text-tinta">Asignado a</TableHead>
                <TableHead className="text-right font-bold text-tinta">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecursos.map((rec) => (
                <TableRow key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-tinta">
                    <div className="flex items-center gap-2">
                      {getIcon(rec.tipo_contenido)}
                      {rec.titulo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {rec.tipo_contenido.includes('pdf') ? 'PDF' :
                       rec.tipo_contenido.includes('video') ? 'Video' :
                       rec.tipo_contenido.includes('audio') ? 'Audio' : 'Link'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {rec.recursos_asignados?.length || 0} {rec.recursos_asignados?.length === 1 ? 'paciente' : 'pacientes'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <a href={rec.url_abrible || rec.url_recurso} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          Abrir
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignModal(rec)}
                        disabled={isPending}
                        className="h-8 px-2 text-marca hover:text-marca/90 hover:bg-marca/10"
                        title="Asignar a pacientes"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(rec.id)}
                        disabled={isPending}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">
              Gestionar accesos
            </DialogTitle>
            <DialogDescription className="font-sans">
              Asigná explícitamente quién puede ver: <br /> <b>{selectedRecurso?.titulo}</b>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Input
              placeholder="Buscar paciente..."
              value={pacienteSearch}
              onChange={(e) => setPacienteSearch(e.target.value)}
              className="bg-white border-gray-200"
            />

            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-gray-200 bg-white rounded-lg p-2">
              {pacientes.filter(a => a.nombre?.toLowerCase().includes(pacienteSearch.toLowerCase()) || a.email?.toLowerCase().includes(pacienteSearch.toLowerCase())).map((paciente) => (
                <div key={paciente.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-slate-50 transition-colors">
                  <Checkbox
                    id={`paciente-${paciente.id}`}
                    checked={selectedPacienteIds.includes(paciente.id)}
                    onCheckedChange={(checked) => handleTogglePaciente(paciente.id, checked as boolean)}
                    disabled={isPending}
                  />
                  <div
                    className="grid leading-none cursor-pointer flex-1"
                    onClick={() => !isPending && handleTogglePaciente(paciente.id, !selectedPacienteIds.includes(paciente.id))}
                  >
                    <label className="text-sm font-medium leading-none text-tinta peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {paciente.nombre}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{paciente.email}</p>
                  </div>
                </div>
              ))}
              {pacientes.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No hay pacientes activos disponibles.</p>}
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleAssign} disabled={isPending} className="bg-marca hover:bg-marca/90 text-white w-full sm:w-auto px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar accesos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
