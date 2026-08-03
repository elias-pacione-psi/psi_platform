'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Folder, File as FileIcon, ChevronRight, Loader2, FolderPlus, Upload,
  Trash2, Pencil, Download, ExternalLink, BookPlus, Check, Library, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  listarCarpeta, pedirSubidaMaterial, pedirVistaPrevia, pedirDescargaArchivo,
  crearCarpeta, contarContenidoCarpeta, borrarCarpeta, renombrarArchivo,
  renombrarCarpeta, asignarComoLeccion, borrarMultiples, obtenerUsoTotal,
  sincronizarBiblioteca,
} from './actions'
import {
  esCarpetaFijaBibliotecaR2, esZonaBibliotecaR2, seccionBibliotecaR2,
  PREFIJO_BIBLIOTECA_R2, SECCIONES_BIBLIOTECA_R2,
} from '@/utils/r2-marcador'
import type { CarpetaR2, ListadoR2, ObjetoR2 } from '@/utils/r2'

const TIPOS_ACEPTADOS = '.pdf,.txt,.md,.jpg,.jpeg,.png,.webp,.gif,.svg,.mp3,.m4a,.ogg,.oga,.wav,.mp4,.webm,.mov,.doc,.docx,.ppt,.pptx'

function formatearBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const unidades = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`
}

type Modulo = { id: string; titulo: string; programa_id: string; programas: { titulo: string } | null }

export function ArchivosClient({
  inicial,
  usoTotalInicial,
  modulos,
}: {
  inicial: ListadoR2
  usoTotalInicial: number
  modulos: Modulo[]
}) {
  const [prefijo, setPrefijo] = useState('')
  const [listado, setListado] = useState<ListadoR2>(inicial)
  const [usoTotal, setUsoTotal] = useState(usoTotalInicial)
  const [cargando, setCargando] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [subiendo, setSubiendo] = useState<{ hecho: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [openCrearCarpeta, setOpenCrearCarpeta] = useState(false)
  const [nombreCarpeta, setNombreCarpeta] = useState('')
  const [renombrando, setRenombrando] = useState<{ tipo: 'archivo' | 'carpeta'; item: ObjetoR2 | CarpetaR2 } | null>(null)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [asignando, setAsignando] = useState<ObjetoR2 | null>(null)
  const [programaElegido, setProgramaElegido] = useState('')
  const [moduloElegido, setModuloElegido] = useState('')
  const [tituloLeccion, setTituloLeccion] = useState('')

  // Los módulos vienen planos; el curso sale de agruparlos. Antes el diálogo mostraba
  // una sola lista con todos los módulos de todos los cursos mezclados, que con más de
  // un programa es imposible de leer.
  const programasDisponibles = [...new Map(
    modulos.map((m) => [m.programa_id, { id: m.programa_id, titulo: m.programas?.titulo ?? 'Sin curso' }]),
  ).values()].sort((a, b) => a.titulo.localeCompare(b.titulo))

  const modulosDelPrograma = modulos.filter((m) => m.programa_id === programaElegido)

  // base-ui resuelve la etiqueta que muestra el trigger desde `items`: sin esto, una vez
  // elegida la opción el campo mostraba el value crudo (el uuid) en vez del nombre.
  const itemsProgramas = Object.fromEntries(programasDisponibles.map((p) => [p.id, p.titulo]))
  const itemsModulos = Object.fromEntries(modulosDelPrograma.map((m) => [m.id, m.titulo]))

  async function navegar(nuevoPrefijo: string) {
    setCargando(true)
    setSeleccion(new Set())
    const res = await listarCarpeta(nuevoPrefijo)
    setCargando(false)
    if ('error' in res) {
      toast.error(res.error)
      return
    }
    setPrefijo(nuevoPrefijo)
    setListado(res)
  }

  async function handleSubir(files: FileList | null) {
    if (!files || files.length === 0) return

    // `files` es el FileList vivo del <input>: limpiar el input más abajo lo deja en 0,
    // así que el total se guarda ahora y no se vuelve a leer de ahí.
    const total = files.length
    setSubiendo({ hecho: 0, total })

    // Se cuentan las que realmente entraron: con `i` se anunciaba "Subida completa"
    // aunque hubieran fallado todas (cada archivo hace `continue` con su propio error).
    let subidos = 0

    for (let i = 0; i < total; i++) {
      const file = files[i]
      const res = await pedirSubidaMaterial(prefijo, file.name, file.type, file.size)
      if ('error' in res) {
        toast.error(`${file.name}: ${res.error}`)
        continue
      }
      try {
        const put = await fetch(res.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
        if (!put.ok) throw new Error(`HTTP ${put.status}`)
      } catch (err) {
        toast.error(`${file.name}: error subiendo (${err instanceof Error ? err.message : 'desconocido'})`)
        continue
      }
      subidos++
      setSubiendo({ hecho: subidos, total })
    }

    setSubiendo(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (subidos === 0) return // los errores ya se mostraron uno por uno

    const resumen = subidos === total ? 'Subida completa' : `${subidos} de ${total} subido(s)`

    // Lo subido a Biblioteca R2 tiene que aparecer del otro lado sin un paso extra.
    if (esZonaBibliotecaR2(prefijo)) {
      const res = await sincronizarBiblioteca()
      if ('error' in res) toast.error(`${resumen}, pero no se pudo publicar en Biblioteca: ${res.error}`)
      else toast.success(res.agregados > 0 ? `${resumen} · ${res.agregados} publicado(s) en Biblioteca` : resumen)
    } else {
      toast.success(resumen)
    }

    navegar(prefijo)
  }

  function handleCrearCarpeta() {
    startTransition(async () => {
      const res = await crearCarpeta(prefijo, nombreCarpeta)
      if ('error' in res) { toast.error(res.error); return }
      toast.success('Carpeta creada')
      setOpenCrearCarpeta(false)
      setNombreCarpeta('')
      navegar(prefijo)
    })
  }

  async function handleBorrarCarpeta(c: CarpetaR2) {
    const conteo = await contarContenidoCarpeta(c.prefijo)
    const cantidad = 'archivos' in conteo ? conteo.archivos : 0
    if (!confirm(`¿Borrar "${c.nombre}" y los ${cantidad} archivo(s) que contiene? No se puede deshacer.`)) return

    startTransition(async () => {
      const res = await borrarCarpeta(c.prefijo)
      if ('error' in res) { toast.error(res.error); return }
      toast.success(`Carpeta borrada (${res.borrados} archivo(s))`)
      navegar(prefijo)
      refrescarUso()
    })
  }

  function handleBorrarSeleccion() {
    if (seleccion.size === 0) return
    if (!confirm(`¿Borrar ${seleccion.size} elemento(s) seleccionado(s)? No se puede deshacer.`)) return

    const items = [...seleccion].map((id) => ({
      id,
      tipo: (id.endsWith('/') ? 'carpeta' : 'archivo') as 'archivo' | 'carpeta',
    }))

    startTransition(async () => {
      const res = await borrarMultiples(items)
      if ('error' in res) { toast.error(res.error); return }
      toast.success(`${res.borrados} archivo(s) borrado(s)`)
      setSeleccion(new Set())
      navegar(prefijo)
      refrescarUso()
    })
  }

  function handleRenombrar() {
    if (!renombrando) return
    const nuevo = nombreNuevo.trim()
    if (!nuevo) return

    startTransition(async () => {
      const res = renombrando.tipo === 'archivo'
        ? await renombrarArchivo((renombrando.item as ObjetoR2).key, nuevo)
        : await renombrarCarpeta((renombrando.item as CarpetaR2).prefijo, nuevo)

      if ('error' in res) { toast.error(res.error); return }
      const refs = 'referenciasActualizadas' in res ? res.referenciasActualizadas : 0
      toast.success(refs ? `Renombrado (${refs} referencia(s) actualizadas)` : 'Renombrado')
      setRenombrando(null)
      setNombreNuevo('')
      navegar(prefijo)
    })
  }

  async function handleVistaPrevia(key: string) {
    const res = await pedirVistaPrevia(key)
    if ('error' in res) { toast.error(res.error); return }
    window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  async function handleDescargar(key: string) {
    const res = await pedirDescargaArchivo(key)
    if ('error' in res) { toast.error(res.error); return }
    window.open(res.url, '_blank', 'noopener,noreferrer')
  }

  function handleAsignar() {
    if (!asignando || !moduloElegido || !tituloLeccion.trim()) return
    startTransition(async () => {
      const res = await asignarComoLeccion(asignando.key, moduloElegido, tituloLeccion.trim())
      if ('error' in res) { toast.error(res.error); return }
      toast.success('Lección creada')
      setAsignando(null)
      setModuloElegido('')
      setTituloLeccion('')
    })
  }

  async function refrescarUso() {
    // Best-effort: si falla, se queda con el número anterior — no es crítico.
    const res = await obtenerUsoTotal()
    if ('bytes' in res) setUsoTotal(res.bytes)
  }

  function toggleSeleccion(id: string, checked: boolean) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  const tramos = prefijo.split('/').filter(Boolean)

  // La leyenda aparece en Inicio (donde se ve la carpeta) y adentro de ella, que es donde
  // hace falta saber qué pasa con lo que se sube.
  const enBiblioteca = esZonaBibliotecaR2(prefijo)
  const seccionActual = seccionBibliotecaR2(prefijo)
  const mostrarLeyenda = prefijo === '' || enBiblioteca

  // "Seleccionar todo" no puede alcanzar las carpetas fijas: el borrado múltiple las
  // ignora, y marcarlas dejaría el contador diciendo que van a borrarse cosas que no.
  const seleccionables = [
    ...listado.carpetas.filter((c) => !esCarpetaFijaBibliotecaR2(c.prefijo)).map((c) => c.prefijo),
    ...listado.archivos.map((a) => a.key),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card border border-border rounded-2xl p-4">
        <div className="text-sm font-sans">
          <span className="text-muted-foreground">Uso del bucket: </span>
          <span className="font-bold text-tinta">{formatearBytes(usoTotal)}</span>
        </div>
        <div className="flex gap-2">
          {seleccion.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBorrarSeleccion} disabled={isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Borrar {seleccion.size}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setOpenCrearCarpeta(true)}>
            <FolderPlus className="w-4 h-4 mr-2" /> Nueva carpeta
          </Button>
          <Button
            size="sm"
            className="bg-marca hover:bg-marca/90 text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!subiendo}
          >
            {subiendo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {subiendo ? `Subiendo ${subiendo.hecho}/${subiendo.total}` : 'Subir archivos'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={TIPOS_ACEPTADOS}
            className="hidden"
            onChange={(e) => handleSubir(e.target.files)}
          />
        </div>
      </div>

      {mostrarLeyenda && (
        <div className="flex gap-3 bg-marca/10 border border-marca/30 rounded-2xl p-4 font-sans text-sm">
          <Library className="w-5 h-5 text-marca shrink-0 mt-0.5" />
          <div className="space-y-2 text-tinta">
            <p className="font-bold">
              La carpeta <span className="font-mono">Biblioteca R2</span> está enlazada con la sección Biblioteca.
            </p>
            <p className="text-muted-foreground">
              Lo que subas ahí aparece solo en <b>Biblioteca</b>, listo para asignar a tus alumnos —
              no hace falta volver a cargarlo. Si borrás un archivo de la carpeta, también sale de
              Biblioteca. La carpeta y sus secciones no se pueden borrar ni renombrar.
            </p>
            {seccionActual ? (
              <p className="text-muted-foreground">
                Estás en <b>{seccionActual.carpeta}</b>: lo que subas acá se ve en la pestaña{' '}
                <b>{seccionActual.pestana}</b> del alumno. Acepta {seccionActual.extensiones.join(', ')}.
              </p>
            ) : (
              <p className="text-muted-foreground">
                Cada subcarpeta es una pestaña de la vista del alumno:{' '}
                {SECCIONES_BIBLIOTECA_R2.map((s, i) => (
                  <span key={s.carpeta}>
                    {i > 0 && ' · '}
                    <b>{s.carpeta}</b> → {s.pestana}
                  </span>
                ))}
                .
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 flex-wrap text-sm font-sans px-1">
        <button onClick={() => navegar('')} className="text-tinta hover:text-marca font-bold hover:underline">
          Inicio
        </button>
        {tramos.map((tramo, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <button
              onClick={() => navegar(tramos.slice(0, i + 1).join('/') + '/')}
              className="text-tinta hover:text-marca hover:underline"
            >
              {tramo}
            </button>
          </span>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {cargando ? (
          <div className="py-16 flex justify-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : listado.carpetas.length === 0 && listado.archivos.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground font-sans">Carpeta vacía.</div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={seleccionables.length > 0 && seleccion.size === seleccionables.length}
                    onCheckedChange={(v) => setSeleccion(v ? new Set(seleccionables) : new Set())}
                  />
                </TableHead>
                <TableHead className="font-bold text-tinta">Nombre</TableHead>
                <TableHead className="font-bold text-tinta">Tamaño</TableHead>
                <TableHead className="font-bold text-tinta">Modificado</TableHead>
                <TableHead className="text-right font-bold text-tinta">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listado.carpetas.map((c) => {
                // Las carpetas del espejo de Biblioteca no se ofrecen para borrar ni
                // renombrar (el server lo rechaza igual; acá se saca el botón para no
                // ofrecer algo que va a fallar) ni entran en la selección múltiple.
                const fija = esCarpetaFijaBibliotecaR2(c.prefijo)
                return (
                <TableRow key={c.prefijo} className="hover:bg-muted/50">
                  <TableCell>
                    {!fija && (
                      <Checkbox
                        checked={seleccion.has(c.prefijo)}
                        onCheckedChange={(v) => toggleSeleccion(c.prefijo, v as boolean)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => navegar(c.prefijo)} className="flex items-center gap-2 text-tinta hover:text-marca font-semibold">
                      {fija ? <Library className="w-4 h-4 text-marca shrink-0" /> : <Folder className="w-4 h-4 text-marca shrink-0" />}
                      {c.nombre}
                      {c.prefijo === PREFIJO_BIBLIOTECA_R2 && (
                        <span className="text-xs font-normal text-muted-foreground">· sección Biblioteca</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatearBytes(c.tamano)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.modificado ? new Date(c.modificado).toLocaleDateString('es-AR') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {fija ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground pr-2" title="Carpeta fija: enlazada con la sección Biblioteca">
                        <Lock className="w-3.5 h-3.5" /> Fija
                      </span>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setRenombrando({ tipo: 'carpeta', item: c }); setNombreNuevo(c.nombre) }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleBorrarCarpeta(c)} className="text-red-600 dark:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                )
              })}
              {listado.archivos.map((a) => (
                <TableRow key={a.key} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={seleccion.has(a.key)}
                      onCheckedChange={(v) => toggleSeleccion(a.key, v as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-tinta">
                      <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" /> {a.nombre}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatearBytes(a.tamano)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {a.modificado ? new Date(a.modificado).toLocaleDateString('es-AR') : '—'}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleVistaPrevia(a.key)} title="Vista previa">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDescargar(a.key)} title="Descargar">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" title="Asignar como lección"
                      onClick={() => { setAsignando(a); setTituloLeccion(a.nombre.replace(/\.[^.]+$/, '')) }}
                    >
                      <BookPlus className="w-4 h-4 text-marca" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setRenombrando({ tipo: 'archivo', item: a }); setNombreNuevo(a.nombre) }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {listado.truncado && (
        <p className="text-xs text-muted-foreground px-1">Esta carpeta tiene más de 1000 elementos: la lista puede estar incompleta.</p>
      )}

      {/* Nueva carpeta */}
      <Dialog open={openCrearCarpeta} onOpenChange={setOpenCrearCarpeta}>
        <DialogContent className="sm:max-w-[420px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-tinta">Nueva carpeta</DialogTitle>
            <DialogDescription className="font-sans">Se crea dentro de {prefijo || 'Inicio'}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="font-bold text-tinta">Nombre</Label>
            <Input value={nombreCarpeta} onChange={(e) => setNombreCarpeta(e.target.value)} className="bg-card border-border" autoFocus />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleCrearCarpeta} disabled={isPending || !nombreCarpeta.trim()} className="bg-marca hover:bg-marca/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Crear
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renombrar */}
      <Dialog open={!!renombrando} onOpenChange={(o) => !o && setRenombrando(null)}>
        <DialogContent className="sm:max-w-[420px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-tinta">Renombrar</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="font-bold text-tinta">Nombre nuevo</Label>
            <Input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} className="bg-card border-border" autoFocus />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleRenombrar} disabled={isPending || !nombreNuevo.trim()} className="bg-marca hover:bg-marca/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asignar como lección */}
      <Dialog open={!!asignando} onOpenChange={(o) => !o && setAsignando(null)}>
        <DialogContent className="sm:max-w-[480px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-tinta">Asignar como lección</DialogTitle>
            <DialogDescription className="font-sans">{asignando?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-tinta">Título de la lección</Label>
              <Input value={tituloLeccion} onChange={(e) => setTituloLeccion(e.target.value)} className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-tinta">Curso</Label>
              <Select
                value={programaElegido}
                onValueChange={(v) => { setProgramaElegido(v || ''); setModuloElegido('') }}
                items={itemsProgramas}
              >
                <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Elegí un curso" /></SelectTrigger>
                <SelectContent>
                  {programasDisponibles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>
                  ))}
                  {programasDisponibles.length === 0 && (
                    <SelectItem value="none" disabled>No hay cursos con módulos todavía</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-tinta">Módulo</Label>
              <Select
                value={moduloElegido}
                onValueChange={(v) => setModuloElegido(v || '')}
                disabled={!programaElegido}
                items={itemsModulos}
              >
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder={programaElegido ? 'Elegí un módulo' : 'Primero elegí el curso'} />
                </SelectTrigger>
                <SelectContent>
                  {modulosDelPrograma.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>
                  ))}
                  {programaElegido && modulosDelPrograma.length === 0 && (
                    <SelectItem value="none" disabled>Este curso no tiene módulos</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleAsignar} disabled={isPending || !moduloElegido || !tituloLeccion.trim()} className="bg-marca hover:bg-marca/90 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
