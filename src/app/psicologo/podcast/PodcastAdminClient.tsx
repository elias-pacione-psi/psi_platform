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
import { pedirVistaPrevia } from '@/app/psicologo/archivos/actions'
import { keyDeMarcadorR2 } from '@/utils/r2-marcador'
import { ZONA_AR } from '@/utils/fecha-ar'
import { formatearDuracion, formatearFechaEpisodio } from '@/utils/podcast'
import { guardarEpisodio, eliminarEpisodio } from './actions'
import { Loader2, Plus, Pencil, Trash2, Mic, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type Episodio = {
  id: string
  numero: number
  titulo: string
  descripcion: string | null
  audio_key: string
  duracion_segundos: number | null
  estado: 'borrador' | 'publicado'
  publicado_en: string
}

// "en-CA" da YYYY-MM-DD, el formato que espera <input type="date">.
const hoyEnArgentina = () => new Date().toLocaleDateString('en-CA', { timeZone: ZONA_AR })

export function PodcastAdminClient({ episodios }: { episodios: Episodio[] }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [seleccionado, setSeleccionado] = useState<Episodio | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [aBorrar, setABorrar] = useState<Episodio | null>(null)

  const [audio, setAudio] = useState('')
  const [duracion, setDuracion] = useState<number | null>(null)
  const [midiendo, setMidiendo] = useState(false)
  const [publicado, setPublicado] = useState(false)

  const siguienteNumero = Math.max(0, ...episodios.map((e) => e.numero)) + 1

  function abrirModal(e: Episodio | null) {
    setSeleccionado(e)
    setErrorMsg(null)
    setAudio(e?.audio_key ?? '')
    setDuracion(e?.duracion_segundos ?? null)
    setPublicado(e?.estado === 'publicado')
    setOpen(true)
  }

  // La duración se lee del propio archivo para no tener que tipearla: se firma una URL de
  // vista previa y el navegador baja solo los metadatos del audio, no el archivo entero.
  async function elegirAudio(valor: string) {
    setAudio(valor)
    setDuracion(null)
    const key = keyDeMarcadorR2(valor)
    if (!key) return

    setMidiendo(true)
    const res = await pedirVistaPrevia(key)
    if ('error' in res) {
      setMidiendo(false)
      return
    }
    const el = new Audio()
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration)) setDuracion(Math.round(el.duration))
      setMidiendo(false)
    }
    el.onerror = () => setMidiendo(false)
    el.src = res.url
  }

  function handleSubmit(formData: FormData) {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await guardarEpisodio(formData)
      if (result?.error) setErrorMsg(result.error)
      else { toast.success('Episodio guardado'); setOpen(false) }
    })
  }

  function handleDelete() {
    if (!aBorrar) return
    startTransition(async () => {
      const result = await eliminarEpisodio(aBorrar.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Episodio eliminado')
      setABorrar(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <a href="/podcast" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-marca hover:underline">
          Ver la página pública <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <Button onClick={() => abrirModal(null)} className="bg-marca hover:bg-marca/90 text-crema">
          <Plus className="w-4 h-4 mr-2" /> Nuevo episodio
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {episodios.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Mic className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold text-tinta">Todavía no hay episodios</h3>
            <p className="text-muted-foreground mt-1">Cargá el primero y marcalo como publicado para que aparezca en /podcast.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16 font-bold text-tinta">N.º</TableHead>
                <TableHead className="font-bold text-tinta">Título</TableHead>
                <TableHead className="font-bold text-tinta">Fecha</TableHead>
                <TableHead className="font-bold text-tinta">Duración</TableHead>
                <TableHead className="font-bold text-tinta">Estado</TableHead>
                <TableHead className="text-right font-bold text-tinta">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {episodios.map((e) => (
                <TableRow key={e.id} className="hover:bg-muted transition-colors">
                  <TableCell className="text-sm text-muted-foreground tabular-nums">{e.numero}</TableCell>
                  <TableCell className="font-medium text-tinta">{e.titulo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatearFechaEpisodio(e.publicado_en)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {e.duracion_segundos ? formatearDuracion(e.duracion_segundos) : '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      e.estado === 'publicado' ? 'bg-marca/10 text-marca' : 'bg-muted text-muted-foreground'
                    }`}>
                      {e.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => abrirModal(e)} className="h-8 px-2" aria-label="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" onClick={() => setABorrar(e)} aria-label="Eliminar"
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
              {seleccionado ? 'Editar episodio' : 'Nuevo episodio'}
            </DialogTitle>
            <DialogDescription className="font-sans">
              El audio (mp3 o m4a) se elige de lo que ya subiste en Disco Duro.
            </DialogDescription>
          </DialogHeader>

          <form action={handleSubmit} className="space-y-4 mt-4">
            {seleccionado && <input type="hidden" name="id" value={seleccionado.id} />}

            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero" className="font-bold text-tinta">N.º</Label>
                <Input
                  id="numero" name="numero" type="number" min="1" step="1" inputMode="numeric" required
                  defaultValue={seleccionado?.numero ?? siguienteNumero} className="bg-card border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo" className="font-bold text-tinta">Título</Label>
                <Input id="titulo" name="titulo" defaultValue={seleccionado?.titulo ?? ''} required maxLength={150} className="bg-card border-border" placeholder="Ej: Ansiedad: qué nos quiere decir" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion" className="font-bold text-tinta">De qué trata</Label>
              <Textarea
                id="descripcion" name="descripcion" maxLength={3000}
                defaultValue={seleccionado?.descripcion ?? ''}
                className="bg-card border-border h-32 resize-none"
                placeholder="Lo que se lee al desplegar el capítulo: temas que se tocan, a quién le puede servir…"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-tinta">Audio</Label>
              <SelectorArchivoR2 id="audio_key" name="audio_key" value={audio} onChange={elegirAudio} required />
              <input type="hidden" name="duracion_segundos" value={duracion ?? ''} />
              <p className="text-xs text-muted-foreground h-4">
                {midiendo
                  ? 'Leyendo la duración…'
                  : duracion
                    ? `Duración: ${formatearDuracion(duracion)}`
                    : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="publicado_en" className="font-bold text-tinta">Fecha</Label>
                <Input
                  id="publicado_en" name="publicado_en" type="date" required
                  defaultValue={seleccionado?.publicado_en ?? hoyEnArgentina()} className="bg-card border-border"
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox id="publicado" checked={publicado} onCheckedChange={(v) => setPublicado(v === true)} />
                <input type="hidden" name="estado" value={publicado ? 'publicado' : 'borrador'} />
                <Label htmlFor="publicado" className="font-sans text-tinta cursor-pointer">
                  Publicado (visible en /podcast)
                </Label>
              </div>
            </div>

            {errorMsg && <p className="text-red-600 dark:text-red-400 text-sm">{errorMsg}</p>}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending || midiendo} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!aBorrar} onOpenChange={(o) => !o && setABorrar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Eliminar este episodio?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Se saca <b>{aBorrar?.titulo}</b> del podcast. El audio queda en Disco Duro — esto
              solo borra la ficha del episodio.
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
