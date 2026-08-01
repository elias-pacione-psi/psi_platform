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
import { SelectorArchivoR2 } from '@/components/SelectorArchivoR2'
import { LABEL_ORIGEN } from '@/utils/taxonomia-labels'

const TIPO_CONTENIDO_DEFAULT = 'drive_pdf'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BibliotecaAdminClient({ recursos, alumnos }: { recursos: any[], alumnos: any[] }) {
  const [open, setOpen] = useState(false)
  const [openAssign, setOpenAssign] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRecurso, setSelectedRecurso] = useState<any>(null)
  const [selectedAlumnoIds, setSelectedAlumnoIds] = useState<string[]>([])
  const [alumnoSearch, setAlumnoSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [tipoContenido, setTipoContenido] = useState(TIPO_CONTENIDO_DEFAULT)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [urlRecurso, setUrlRecurso] = useState('')

  const handleCrear = async (formData: FormData) => {
    startTransition(async () => {
      try {
        if (tipoContenido.startsWith('supabase_') && fileToUpload) {
          setUploading(true)
          const supabase = createClient()
          const fileExt = fileToUpload.name.split('.').pop()
          const fileName = `biblioteca/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`
          // Bucket privado: el alumno lo verá vía URL firmada generada en el servidor
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
          setUrlRecurso('')
          setTipoContenido(TIPO_CONTENIDO_DEFAULT)
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
    const currentAssignments = recurso.recursos_asignados?.map((a: any) => a.alumno_id) || []
    setSelectedAlumnoIds(currentAssignments)
    setAlumnoSearch('')
    setOpenAssign(true)
  }

  const handleToggleAlumno = (alumnoId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedAlumnoIds([...selectedAlumnoIds, alumnoId])
    } else {
      setSelectedAlumnoIds(selectedAlumnoIds.filter(id => id !== alumnoId))
    }
  }

  const handleAssign = () => {
    if (!selectedRecurso) return;

    startTransition(async () => {
      try {
        const result = await asignarRecursoBiblioteca(selectedRecurso.id, selectedAlumnoIds)
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
    if (tipo.includes('video')) return <FileVideo className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (tipo.includes('audio')) return <FileAudio className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    if (tipo.includes('pdf')) return <FileText className="w-4 h-4 text-marca" />;
    return <ExternalLink className="w-4 h-4 text-muted-foreground" />;
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
          className="max-w-md bg-card"
        />
        <Button onClick={() => setOpen(true)} className="bg-marca hover:bg-marca/90 text-crema font-bold rounded-xl h-11 px-6 shadow-sm shrink-0">
          <Plus className="mr-2 h-5 w-5" /> Añadir material
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Nuevo recurso</DialogTitle>
            <DialogDescription>
              Después de crearlo, asignalo a los alumnos que corresponda con el botón de accesos.
            </DialogDescription>
          </DialogHeader>

          <form action={handleCrear} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="titulo" className="font-bold text-tinta">Título del material</Label>
              <Input id="titulo" name="titulo" required className="bg-card" placeholder="Ej: Guía de respiración diafragmática" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_contenido" className="font-bold text-tinta">Tipo de contenido</Label>
              <Select
                name="tipo_contenido"
                required
                value={tipoContenido}
                onValueChange={(val) => setTipoContenido(val || TIPO_CONTENIDO_DEFAULT)}
                items={{
                  drive_pdf: 'Documento / PDF (Google Drive/R2)', drive_video: 'Video (Google Drive/R2)', drive_audio: 'Audio (Google Drive/R2)',
                  dropbox_pdf: 'PDF (Dropbox/R2)', dropbox_video: 'Video (Dropbox/R2)', dropbox_audio: 'Audio (Dropbox/R2)',
                  supabase_pdf: 'PDF (Subir archivo — Supabase)', supabase_video: 'Video (Subir archivo — Supabase)', supabase_audio: 'Audio (Subir archivo — Supabase)',
                  enlace_externo: 'Enlace externo',
                }}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Seleccioná el formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drive_pdf">Documento / PDF (Google Drive/R2)</SelectItem>
                  <SelectItem value="drive_video">Video (Google Drive/R2)</SelectItem>
                  <SelectItem value="drive_audio">Audio (Google Drive/R2)</SelectItem>
                  <SelectItem value="dropbox_pdf">PDF (Dropbox/R2)</SelectItem>
                  <SelectItem value="dropbox_video">Video (Dropbox/R2)</SelectItem>
                  <SelectItem value="dropbox_audio">Audio (Dropbox/R2)</SelectItem>
                  <SelectItem value="supabase_pdf">PDF (Subir archivo — Supabase)</SelectItem>
                  <SelectItem value="supabase_video">Video (Subir archivo — Supabase)</SelectItem>
                  <SelectItem value="supabase_audio">Audio (Subir archivo — Supabase)</SelectItem>
                  <SelectItem value="enlace_externo">Enlace externo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_recurso" className="font-bold text-tinta">
                {tipoContenido.startsWith('supabase_') ? 'Seleccionar archivo' : tipoContenido === 'enlace_externo' ? 'Enlace del recurso' : 'Enlace del recurso o archivo del bucket'}
              </Label>
              {tipoContenido.startsWith('supabase_') ? (
                <Input
                  id="archivo_subida"
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="bg-card border-border cursor-pointer"
                  accept={tipoContenido.includes('video') ? 'video/*' : tipoContenido.includes('audio') ? 'audio/*' : '.pdf'}
                  required
                />
              ) : tipoContenido === 'enlace_externo' ? (
                <Input id="url_recurso" name="url_recurso" type="url" required className="bg-card" placeholder="https://..." />
              ) : (
                <SelectorArchivoR2 id="url_recurso" name="url_recurso" value={urlRecurso} onChange={setUrlRecurso} required />
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isPending || uploading} className="bg-noche hover:bg-noche/90 text-white w-full sm:w-auto px-8">
                {isPending || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar recurso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {filteredRecursos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Library className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-tinta">Sin resultados</h3>
            <p className="text-muted-foreground mt-1">Subí materiales de apoyo para tus alumnos, o probá otra búsqueda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-tinta">Título</TableHead>
                <TableHead className="font-bold text-tinta">Formato</TableHead>
                <TableHead className="font-bold text-tinta">Asignado a</TableHead>
                <TableHead className="text-right font-bold text-tinta">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecursos.map((rec) => (
                <TableRow key={rec.id} className="hover:bg-muted transition-colors">
                  <TableCell className="font-medium text-tinta">
                    <div className="flex items-center gap-2">
                      {getIcon(rec.tipo_contenido)}
                      {rec.titulo}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                        {rec.tipo_contenido.includes('pdf') ? 'PDF' :
                         rec.tipo_contenido.includes('video') ? 'Video' :
                         rec.tipo_contenido.includes('audio') ? 'Audio' : 'Link'}
                      </span>
                      {rec.origen && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" title="De dónde viene el archivo">
                          {LABEL_ORIGEN[rec.origen] ?? rec.origen}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rec.recursos_asignados?.length || 0} {rec.recursos_asignados?.length === 1 ? 'alumno' : 'alumnos'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <a href={rec.url_abrible || rec.url_recurso} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                          Abrir
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignModal(rec)}
                        disabled={isPending}
                        className="h-8 px-2 text-marca hover:text-marca/90 hover:bg-marca/10"
                        title="Asignar a alumnos"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(rec.id)}
                        disabled={isPending}
                        className="h-8 px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
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
              placeholder="Buscar alumno..."
              value={alumnoSearch}
              onChange={(e) => setAlumnoSearch(e.target.value)}
              className="bg-card border-border"
            />

            <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border bg-card rounded-lg p-2">
              {alumnos.filter(a => a.nombre?.toLowerCase().includes(alumnoSearch.toLowerCase()) || a.email?.toLowerCase().includes(alumnoSearch.toLowerCase())).map((alumno) => (
                <div key={alumno.id} className="flex items-center space-x-3 bg-muted p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                  <Checkbox
                    id={`alumno-${alumno.id}`}
                    checked={selectedAlumnoIds.includes(alumno.id)}
                    onCheckedChange={(checked) => handleToggleAlumno(alumno.id, checked as boolean)}
                    disabled={isPending}
                  />
                  <div
                    className="grid leading-none cursor-pointer flex-1"
                    onClick={() => !isPending && handleToggleAlumno(alumno.id, !selectedAlumnoIds.includes(alumno.id))}
                  >
                    <label className="text-sm font-medium leading-none text-tinta peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {alumno.nombre}
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{alumno.email}</p>
                  </div>
                </div>
              ))}
              {alumnos.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No hay alumnos activos disponibles.</p>}
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleAssign} disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema w-full sm:w-auto px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar accesos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
