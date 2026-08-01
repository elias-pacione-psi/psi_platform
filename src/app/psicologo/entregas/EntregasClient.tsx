'use client'

import { useState, useTransition } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { revisarEntrega } from '../actions'
import { Loader2, Download, Inbox, CheckCircle2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EntregasClient({ entregas }: { entregas: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sel, setSel] = useState<any>(null)
  const [comentario, setComentario] = useState('')

  const pendientes = entregas.filter(e => e.estado === 'entregada')
  const revisadas = entregas.filter(e => e.estado === 'revisada')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openReview = (e: any) => { setSel(e); setComentario(e.comentario_instructor || ''); setOpen(true) }

  function handleRevisar() {
    startTransition(async () => {
      const result = await revisarEntrega(sel.id, comentario)
      if (result?.error) toast.error(result.error)
      else { toast.success('Entrega revisada'); setOpen(false) }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTabla = (list: any[]) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {list.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">
          <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" /> No hay entregas en esta pestaña.
        </div>
      ) : (
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="font-heading font-semibold text-tinta">Alumno</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Trabajo</TableHead>
              <TableHead className="font-heading font-semibold text-tinta">Fecha</TableHead>
              <TableHead className="text-right font-heading font-semibold text-tinta">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="font-medium text-tinta">{e.alumnos?.nombre}</div>
                  <div className="text-xs text-muted-foreground">{e.alumnos?.email}</div>
                </TableCell>
                <TableCell>
                  <div className="text-tinta">{e.lecciones?.titulo}</div>
                  <div className="text-xs text-muted-foreground">{e.lecciones?.programas?.titulo}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(e.updated_at).toLocaleDateString('es-AR')}</TableCell>
                <TableCell className="text-right space-x-2">
                  {e.archivo_firmado && (
                    <a href={e.archivo_firmado} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"><Download className="w-4 h-4 mr-1" /> Archivo</Button>
                    </a>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openReview(e)} className="text-marca border-marca hover:bg-marca hover:text-crema">
                    <MessageSquare className="w-4 h-4 mr-1" /> {e.estado === 'revisada' ? 'Ver' : 'Revisar'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <>
      <Tabs defaultValue="pendientes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-card border border-border">
          <TabsTrigger value="pendientes" className="font-sans font-bold text-tinta data-[state=active]:bg-crema relative">
            Pendientes
            {pendientes.length > 0 && <span className="absolute top-1 right-2 bg-marca text-crema text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{pendientes.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="revisadas" className="font-sans font-bold text-tinta data-[state=active]:bg-crema">Revisadas</TabsTrigger>
        </TabsList>
        <TabsContent value="pendientes">{renderTabla(pendientes)}</TabsContent>
        <TabsContent value="revisadas">{renderTabla(revisadas)}</TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-crema">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl text-tinta">Devolución</DialogTitle>
            <DialogDescription className="font-sans">{sel?.alumnos?.nombre} — {sel?.lecciones?.titulo}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {sel?.comentario_alumno && (
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-tinta/60 mb-1">Comentario del alumno</p>
                <p className="text-sm text-tinta whitespace-pre-wrap">{sel.comentario_alumno}</p>
              </div>
            )}
            {sel?.archivo_firmado && (
              <a href={sel.archivo_firmado} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"><Download className="w-4 h-4 mr-2" /> Descargar archivo entregado</Button>
              </a>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-tinta">Tu devolución (feedback pedagógico)</label>
              <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} className="bg-card border-border h-32" placeholder="Comentarios sobre el trabajo, aspectos a mejorar, etc." />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleRevisar} disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema px-8">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Guardar y marcar revisada</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
