'use client'

import { useState } from 'react'
import { Folder, File as FileIcon, ChevronRight, Loader2, FolderOpen, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { listarCarpeta } from '@/app/psicologo/archivos/actions'
import { marcarKeyR2, keyDeMarcadorR2, PREFIJO_ENTREGAS_R2 } from '@/utils/r2-marcador'
import type { ListadoR2 } from '@/utils/r2'

// Reemplaza al <Input type="url"> de texto libre en los formularios de lección y
// biblioteca, pero sin sacarlo: pegar un link de Drive/Dropbox sigue andando igual. Lo
// que suma es un botón al lado para elegir un archivo ya subido a R2 en vez de tener que
// ir al bucket y copiar el link. Al elegir, no se guarda una URL real sino la marca de
// utils/r2-marcador.ts — la resuelve resolverUrlRecurso() en el momento de mostrarle el
// material al alumno.
export function SelectorArchivoR2({
  id,
  name,
  value,
  onChange,
  required,
}: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [prefijo, setPrefijo] = useState('')
  const [listado, setListado] = useState<ListadoR2 | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const keyElegida = keyDeMarcadorR2(value)

  async function navegar(nuevoPrefijo: string) {
    setCargando(true)
    setError(null)
    const res = await listarCarpeta(nuevoPrefijo)
    setCargando(false)
    if ('error' in res) {
      // Además del toast (que se disuelve solo): sin esto, el diálogo queda con
      // `listado` en null y el fallback de "Carpeta vacía" miente sobre el estado real.
      setError(res.error)
      toast.error(res.error)
      return
    }
    setPrefijo(nuevoPrefijo)
    setListado(res)
  }

  function abrir() {
    setOpen(true)
    navegar('')
  }

  function elegir(key: string) {
    onChange(marcarKeyR2(key))
    setOpen(false)
  }

  const tramos = prefijo.split('/').filter(Boolean)

  // Con un archivo ya elegido, se muestra su nombre en vez del r2key:// crudo — eso no
  // es una URL, así que mostrarlo tal cual en un input de texto solo confundiría.
  if (keyElegida) {
    const nombre = keyElegida.split('/').pop() || keyElegida
    return (
      <div className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-2">
        <FileIcon className="w-4 h-4 text-marca shrink-0" />
        <span className="text-sm text-tinta truncate flex-1 font-sans">{nombre}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange('')}
          title="Quitar y elegir otro"
          className="h-7 px-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
        <input type="hidden" name={name} value={value} required={required} />
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-card border-border flex-1"
          placeholder="https://..."
          required={required}
        />
        <Button type="button" variant="outline" onClick={abrir} className="shrink-0 font-sans">
          <FolderOpen className="w-4 h-4 mr-2" />
          Del bucket
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-tinta">Elegir del bucket</DialogTitle>
            <DialogDescription className="font-sans">
              Navegá las carpetas y elegí el archivo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-1 flex-wrap text-sm font-sans">
            <button
              type="button"
              onClick={() => navegar('')}
              className="text-tinta hover:text-marca font-bold hover:underline"
            >
              Inicio
            </button>
            {tramos.map((tramo, i) => {
              const ruta = tramos.slice(0, i + 1).join('/') + '/'
              return (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => navegar(ruta)}
                    className="text-tinta hover:text-marca hover:underline"
                  >
                    {tramo}
                  </button>
                </span>
              )
            })}
          </div>

          {cargando ? (
            <div className="py-8 flex justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center py-8 text-red-600 dark:text-red-400 text-sm font-sans">{error}</p>
          ) : !listado || (listado.carpetas.length === 0 && listado.archivos.length === 0) ? (
            <p className="text-center py-8 text-muted-foreground text-sm font-sans">Carpeta vacía.</p>
          ) : (
            <div className="space-y-1">
              {listado.carpetas
                // Las entregas de alumnos no son material de curso: se ocultan acá
                // igual que en /psicologo/archivos.
                .filter((c) => c.prefijo !== PREFIJO_ENTREGAS_R2)
                .map((c) => (
                  <button
                    type="button"
                    key={c.prefijo}
                    onClick={() => navegar(c.prefijo)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left"
                  >
                    <Folder className="w-4 h-4 text-marca shrink-0" />
                    <span className="text-sm text-tinta truncate font-sans">{c.nombre}</span>
                  </button>
                ))}
              {listado.archivos.map((a) => (
                <button
                  type="button"
                  key={a.key}
                  onClick={() => elegir(a.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left"
                >
                  <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-tinta truncate font-sans">{a.nombre}</span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
