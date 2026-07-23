'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { guardarActividad, eliminarActividad, guardarUnidad, eliminarUnidad } from '../../actions'
import { Loader2, Settings2, Plus, ArrowLeft, Trash2, FolderOpen } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminActividadesClient({ programa, unidades, actividades }: { programa: any, unidades: any[], actividades: any[] }) {
  // Estados para actividades
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedActividad, setSelectedActividad] = useState<any>(null)
  const [openActividad, setOpenActividad] = useState(false)
  const [tipoContenido, setTipoContenido] = useState<string>('drive_video')
  const [selectedUnidadIdParaNuevaActividad, setSelectedUnidadIdParaNuevaActividad] = useState<string | null>(null)

  // Estados para unidades
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedUnidad, setSelectedUnidad] = useState<any>(null)
  const [openUnidad, setOpenUnidad] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Handlers para UNIDADES
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModalUnidad = (unidad: any = null) => {
    setSelectedUnidad(unidad)
    setOpenUnidad(true)
    setErrorMsg(null)
  }

  async function handleUnidadSubmit(formData: FormData) {
    setErrorMsg(null)
    formData.set('programa_id', programa.id)

    startTransition(async () => {
      const result = await guardarUnidad(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setOpenUnidad(false)
      }
    })
  }

  async function handleUnidadDelete(id: string) {
    if (!confirm('¿Seguro que querés eliminar esta unidad? Esto borra todas sus actividades.')) return
    startTransition(async () => {
      await eliminarUnidad(id, programa.id)
    })
  }

  // Handlers para ACTIVIDADES
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModalActividad = (unidadId: string, actividad: any = null) => {
    setSelectedUnidadIdParaNuevaActividad(unidadId)
    setSelectedActividad(actividad)
    setTipoContenido(actividad?.tipo_contenido || 'drive_video')
    setFileToUpload(null)
    setOpenActividad(true)
    setErrorMsg(null)
  }

  async function handleActividadSubmit(formData: FormData) {
    setErrorMsg(null)

    // Si es un archivo a subir, va primero al bucket privado; guardamos el PATH
    // (el paciente lo verá vía URL firmada generada en el servidor)
    if (tipoContenido.startsWith('supabase_') && fileToUpload) {
      setUploading(true)
      const supabase = createClient()
      const fileExt = fileToUpload.name.split('.').pop()
      const fileName = `actividades/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`
      const { error } = await supabase.storage.from('materiales').upload(fileName, fileToUpload)

      if (error) {
        setErrorMsg(`Error al subir archivo: ${error.message}`)
        setUploading(false)
        return
      }

      formData.set('url_recurso', fileName)
      setUploading(false)
    } else if (tipoContenido.startsWith('supabase_') && selectedActividad?.url_recurso) {
      // Edición sin reemplazar archivo: conservar el path existente
      formData.set('url_recurso', selectedActividad.url_recurso)
    }

    formData.set('tipo_contenido', tipoContenido)
    formData.set('programa_id', programa.id)
    if (selectedUnidadIdParaNuevaActividad) {
      formData.set('unidad_id', selectedUnidadIdParaNuevaActividad)
    }

    startTransition(async () => {
      const result = await guardarActividad(formData)
      if (result?.error) {
        setErrorMsg(result.error)
      } else {
        setOpenActividad(false)
        setFileToUpload(null)
      }
    })
  }

  async function handleActividadDelete(id: string) {
    if (!confirm('¿Seguro que querés eliminar este material? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await eliminarActividad(id, programa.id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/psicologo/programas">
          <Button variant="outline" size="icon" className="rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-heading font-bold text-tinta">Estructura del programa</h1>
          <p className="text-muted-foreground mt-2 font-sans">{programa.titulo}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => openModalUnidad(null)} className="bg-marca hover:bg-marca/90 text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Crear nueva unidad
        </Button>
      </div>

      {unidades.length === 0 ? (
        <div className="bg-white border-none shadow-sm rounded-xl p-12 text-center text-muted-foreground">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          Aún no hay unidades creadas en este programa.
        </div>
      ) : (
        <div className="space-y-8">
          {unidades.map((unidad) => {
            const actividadesDeUnidad = actividades.filter(l => l.unidad_id === unidad.id)
            return (
              <div key={unidad.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-bold text-xl text-tinta">{unidad.titulo}</h2>
                    {unidad.descripcion && <p className="text-sm text-muted-foreground">{unidad.descripcion}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openModalActividad(unidad.id)} className="font-sans text-marca border-marca hover:bg-marca hover:text-white" disabled={isPending}>
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar material
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openModalUnidad(unidad)} className="font-sans" disabled={isPending}>
                      <Settings2 className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleUnidadDelete(unidad.id)} className="font-sans" disabled={isPending}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-heading font-semibold text-tinta w-16">#</TableHead>
                      <TableHead className="font-heading font-semibold text-tinta">Material</TableHead>
                      <TableHead className="font-heading font-semibold text-tinta">Tipo</TableHead>
                      <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividadesDeUnidad.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-sm text-muted-foreground">Esta unidad está vacía.</TableCell>
                      </TableRow>
                    ) : actividadesDeUnidad.map((actividad, index) => (
                      <TableRow key={actividad.id}>
                        <TableCell className="font-medium text-tinta">{index + 1}</TableCell>
                        <TableCell className="font-medium text-tinta max-w-[300px] truncate">{actividad.titulo}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 capitalize border border-gray-200">
                            {actividad.tipo_contenido.replace('drive_', '').replace('dropbox_', '').replace('supabase_', '').replace('texto_', '')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openModalActividad(unidad.id, actividad)} className="font-sans" disabled={isPending}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleActividadDelete(actividad.id)} className="font-sans text-red-600 hover:text-red-700 hover:bg-red-50" disabled={isPending}>
                            Borrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para Unidad */}
      <Dialog open={openUnidad} onOpenChange={setOpenUnidad}>
        <DialogContent className="sm:max-w-[500px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">
              {selectedUnidad ? 'Editar unidad' : 'Crear nueva unidad'}
            </DialogTitle>
            <DialogDescription className="font-sans">
              Definí el nombre y la descripción del agrupador de materiales.
            </DialogDescription>
          </DialogHeader>

          <form action={handleUnidadSubmit} className="space-y-4 mt-4">
            {selectedUnidad && <input type="hidden" name="id" value={selectedUnidad.id} />}

            <div className="space-y-2">
              <Label htmlFor="tituloUnidad" className="font-bold text-tinta">Título de la unidad</Label>
              <Input id="tituloUnidad" name="titulo" defaultValue={selectedUnidad?.titulo || ''} placeholder="Ej: Semana 1 - Psicoeducación" className="bg-white border-gray-200" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcionUnidad" className="font-bold text-tinta">Descripción (opcional)</Label>
              <Textarea
                id="descripcionUnidad"
                name="descripcion"
                defaultValue={selectedUnidad?.descripcion || ''}
                className="bg-white border-gray-200 resize-none h-20"
              />
            </div>

            {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-white px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar unidad"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Material (Actividad) */}
      <Dialog open={openActividad} onOpenChange={setOpenActividad}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">
              {selectedActividad ? 'Editar material' : 'Agregar nuevo material'}
            </DialogTitle>
            <DialogDescription className="font-sans">
              Cargá el contenido: un enlace externo, un archivo propio o un texto.
            </DialogDescription>
          </DialogHeader>

          <form action={handleActividadSubmit} className="space-y-4 mt-4">
            {selectedActividad && <input type="hidden" name="id" value={selectedActividad.id} />}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="titulo" className="font-bold text-tinta">Nombre del material</Label>
                <Input id="titulo" name="titulo" defaultValue={selectedActividad?.titulo || ''} className="bg-white border-gray-200" required />
              </div>

              <div className="space-y-2 w-full sm:w-[280px] shrink-0">
                <Label className="font-bold text-tinta">Tipo de contenido</Label>
                <Select value={tipoContenido} onValueChange={(value) => setTipoContenido(value || 'drive_video')}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="Seleccioná un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drive_video">Video (Google Drive)</SelectItem>
                    <SelectItem value="drive_audio">Audio (Google Drive)</SelectItem>
                    <SelectItem value="drive_pdf">PDF (Google Drive)</SelectItem>
                    <SelectItem value="drive_image">Imagen (Google Drive/URL)</SelectItem>
                    <SelectItem value="dropbox_video">Video (Dropbox)</SelectItem>
                    <SelectItem value="dropbox_audio">Audio (Dropbox)</SelectItem>
                    <SelectItem value="dropbox_pdf">PDF (Dropbox)</SelectItem>
                    <SelectItem value="supabase_video">Video (Subir archivo)</SelectItem>
                    <SelectItem value="supabase_audio">Audio (Subir archivo)</SelectItem>
                    <SelectItem value="supabase_pdf">PDF (Subir archivo)</SelectItem>
                    <SelectItem value="texto_markdown">Texto (Markdown)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_recurso" className="font-bold text-tinta">
                {tipoContenido === 'texto_markdown' ? 'Contenido del texto' :
                 tipoContenido.startsWith('supabase_') ? 'Seleccionar archivo' :
                 'Enlace del recurso (Drive/Dropbox/URL)'}
              </Label>
              {tipoContenido === 'texto_markdown' ? (
                <Textarea
                  id="url_recurso"
                  name="url_recurso"
                  defaultValue={selectedActividad?.url_recurso || ''}
                  className="bg-white border-gray-200 h-32 font-mono text-sm"
                  placeholder={'# Título\n\nContenido de la actividad...'}
                  required={true}
                />
              ) : tipoContenido.startsWith('supabase_') ? (
                <div className="space-y-2">
                  <Input
                    id="archivo_supabase"
                    type="file"
                    onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                    className="bg-white border-gray-200 cursor-pointer"
                    accept={tipoContenido.includes('video') ? 'video/*' : tipoContenido.includes('audio') ? 'audio/*' : '.pdf'}
                    required={!selectedActividad?.url_recurso}
                  />
                  {selectedActividad?.url_recurso && (
                    <p className="text-xs text-muted-foreground">Archivo actual: <a href={selectedActividad.url_abrible || selectedActividad.url_recurso} target="_blank" rel="noreferrer" className="text-marca underline">Ver archivo</a> (subí uno nuevo para reemplazarlo)</p>
                  )}
                </div>
              ) : (
                <Input
                  id="url_recurso"
                  name="url_recurso"
                  defaultValue={selectedActividad?.url_recurso || ''}
                  className="bg-white border-gray-200"
                  placeholder="https://..."
                  required={true}
                />
              )}
            </div>

            {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending || uploading} className="bg-marca hover:bg-marca/90 text-white px-8">
                {isPending || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar material"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
