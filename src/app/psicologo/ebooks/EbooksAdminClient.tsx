'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { SelectorArchivoR2 } from '@/components/SelectorArchivoR2'
import { guardarEbook, eliminarEbook } from './actions'
import { Loader2, Plus, Pencil, Trash2, BookOpen, ExternalLink, ImageOff } from 'lucide-react'
import { toast } from 'sonner'

type Ebook = {
  id: string
  slug: string
  titulo: string
  descripcion: string | null
  portada_key: string | null
  portada_url: string | null
  archivo_key: string
  precio_centavos: number
  estado: 'borrador' | 'publicado'
  ventas: number
}

const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export function EbooksAdminClient({ ebooks }: { ebooks: Ebook[] }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Ebook | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [aBorrar, setABorrar] = useState<Ebook | null>(null)

  const [portada, setPortada] = useState('')
  const [archivo, setArchivo] = useState('')
  const [publicado, setPublicado] = useState(false)

  function abrirModal(e: Ebook | null) {
    setSeleccionado(e)
    setErrorMsg(null)
    setPortada(e?.portada_key ?? '')
    setArchivo(e?.archivo_key ?? '')
    setPublicado(e?.estado === 'publicado')
    setOpen(true)
  }

  function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await guardarEbook(formData)
      if (result?.error) setErrorMsg(result.error)
      else { toast.success('Ebook guardado'); setOpen(false) }
    })
  }

  function handleDelete() {
    if (!aBorrar) return
    startTransition(async () => {
      const result = await eliminarEbook(aBorrar.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Ebook eliminado')
      setABorrar(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => abrirModal(null)} className="bg-marca hover:bg-marca/90 text-crema">
          <Plus className="w-4 h-4 mr-2" /> Nuevo ebook
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {ebooks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-tinta">Todavía no hay ebooks</h3>
            <p className="text-muted-foreground mt-1">Creá el primero para que aparezca en la vidriera.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead className="font-bold text-tinta">Título</TableHead>
                <TableHead className="font-bold text-tinta">Precio</TableHead>
                <TableHead className="font-bold text-tinta">Estado</TableHead>
                <TableHead className="font-bold text-tinta">Ventas</TableHead>
                <TableHead className="text-right font-bold text-tinta">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ebooks.map((e) => (
                <TableRow key={e.id} className="hover:bg-muted transition-colors">
                  <TableCell>
                    {e.portada_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.portada_url} alt="" className="w-10 h-14 object-cover rounded border border-border" />
                    ) : (
                      <div className="w-10 h-14 rounded border border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <ImageOff className="w-4 h-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-tinta">{e.titulo}</TableCell>
                  <TableCell className="text-sm text-tinta">{formatoARS.format(e.precio_centavos / 100)}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      e.estado === 'publicado'
                        ? 'bg-marca/10 text-marca'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {e.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.ventas}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {e.estado === 'publicado' && (
                        <a href={`/ebooks/${e.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600 dark:text-blue-400" title="Ver en la tienda">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => abrirModal(e)} className="h-8 px-2">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" onClick={() => setABorrar(e)}
                        className="h-8 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[560px] bg-crema max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">
              {seleccionado ? 'Editar ebook' : 'Nuevo ebook'}
            </DialogTitle>
            <DialogDescription className="font-sans">
              El PDF y la portada se eligen de lo que ya subiste en Archivos.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4 mt-4">
            {seleccionado && <input type="hidden" name="id" value={seleccionado.id} />}

            <div className="space-y-2">
              <Label htmlFor="titulo" className="font-bold text-tinta">Título</Label>
              <Input id="titulo" name="titulo" defaultValue={seleccionado?.titulo ?? ''} required className="bg-card border-border" placeholder="Ej: Manejo de la ansiedad" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="font-bold text-tinta">Descripción</Label>
              <Textarea
                id="descripcion" name="descripcion"
                defaultValue={seleccionado?.descripcion ?? ''}
                className="bg-card border-border h-28 resize-none"
                placeholder="Lo que va a leer quien entra a comprarlo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-tinta">Portada (imagen)</Label>
                <SelectorArchivoR2 id="portada_key" name="portada_key" value={portada} onChange={setPortada} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-tinta">Archivo (PDF)</Label>
                <SelectorArchivoR2 id="archivo_key" name="archivo_key" value={archivo} onChange={setArchivo} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="precio_ars" className="font-bold text-tinta">Precio (ARS)</Label>
                <Input
                  id="precio_ars" name="precio_ars" type="number" min="1" step="1" inputMode="numeric"
                  defaultValue={seleccionado ? seleccionado.precio_centavos / 100 : ''}
                  required className="bg-card border-border" placeholder="Ej: 15000"
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox id="publicado" checked={publicado} onCheckedChange={(v) => setPublicado(v === true)} />
                <input type="hidden" name="estado" value={publicado ? 'publicado' : 'borrador'} />
                <Label htmlFor="publicado" className="font-sans text-tinta cursor-pointer">
                  Publicado (visible en /ebooks)
                </Label>
              </div>
            </div>

            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aBorrar} onOpenChange={(o) => !o && setABorrar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Eliminar este ebook?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Se elimina <b>{aBorrar?.titulo}</b> de la tienda. El PDF y la portada quedan en Archivos
              — esto solo borra la ficha de venta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(ev) => { ev.preventDefault(); handleDelete() }} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
