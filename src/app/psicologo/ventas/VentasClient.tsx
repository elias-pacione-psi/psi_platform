'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { confirmarPagoOrden, marcarOrdenReembolsada } from './actions'
import { Loader2, TrendingUp, Receipt, Undo2, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { fechaCorta } from '@/utils/fecha-ar'

type Fila = {
  id: string
  email: string
  ebookTitulo: string
  precioCentavos: number
  estado: 'pendiente' | 'pagada' | 'fallida' | 'reembolsada'
  fecha: string
  /** 'manual' = link de pago cargado a mano: no hay webhook, lo confirma el psicólogo. */
  proveedor: string
}

const formatoARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const ESTILO_ESTADO: Record<Fila['estado'], string> = {
  pagada: 'bg-marca/10 text-marca',
  pendiente: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  fallida: 'bg-muted text-muted-foreground',
  reembolsada: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const LABEL_ESTADO: Record<Fila['estado'], string> = {
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  fallida: 'Fallida',
  reembolsada: 'Reembolsada',
}

export function VentasClient({ filas, totalVentas, ingresosCentavos }: { filas: Fila[]; totalVentas: number; ingresosCentavos: number }) {
  const [busqueda, setBusqueda] = useState('')
  const [isPending, startTransition] = useTransition()
  const [aReembolsar, setAReembolsar] = useState<Fila | null>(null)
  const [aConfirmar, setAConfirmar] = useState<Fila | null>(null)

  const filtradas = filas.filter((f) =>
    f.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    f.ebookTitulo.toLowerCase().includes(busqueda.toLowerCase()),
  )

  // Las pendientes son plata que puede haber entrado sin que nadie se entere: una compra
  // por link manual no manda webhook, así que queda esperando a que el psicólogo la
  // coteje. Van arriba de todo porque son lo único de esta pantalla que pide una acción.
  const pendientes = filas.filter((f) => f.estado === 'pendiente')

  function handleConfirmar() {
    if (!aConfirmar) return
    startTransition(async () => {
      const res = await confirmarPagoOrden(aConfirmar.id)
      if (res?.error) toast.error(res.error)
      else if (res?.avisoMail) toast.warning(res.avisoMail, { duration: 10000 })
      else toast.success('Pago confirmado — el comprador ya puede descargar el ebook')
      setAConfirmar(null)
    })
  }

  function handleReembolsar() {
    if (!aReembolsar) return
    startTransition(async () => {
      const res = await marcarOrdenReembolsada(aReembolsar.id)
      if (res?.error) toast.error(res.error)
      else toast.success('Orden marcada como reembolsada')
      setAReembolsar(null)
    })
  }

  return (
    <div className="space-y-4">
      {pendientes.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-900 rounded-2xl p-5 flex items-start gap-4">
          <Clock className="w-5 h-5 text-orange-700 dark:text-orange-300 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-orange-900 dark:text-orange-200">
              {pendientes.length === 1
                ? 'Hay 1 compra esperando que confirmes el pago'
                : `Hay ${pendientes.length} compras esperando que confirmes el pago`}
            </p>
            <p className="text-orange-800 dark:text-orange-300/90 mt-1 leading-relaxed">
              Fijate en tu cuenta de Mercado Pago si la plata entró y confirmalas abajo con
              el ✓. Hasta que las confirmes, esa gente no puede descargar lo que compró.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-marca/10 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-marca" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-tinta">{totalVentas}</p>
            <p className="text-sm text-muted-foreground">{totalVentas === 1 ? 'venta pagada' : 'ventas pagadas'}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-marca/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-marca" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-tinta">{formatoARS.format(ingresosCentavos / 100)}</p>
            <p className="text-sm text-muted-foreground">ingresos acumulados</p>
          </div>
        </div>
      </div>

      <Input
        placeholder="Buscar por email o ebook..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="max-w-md bg-card"
      />

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {filas.length === 0 ? 'Todavía no hay ninguna orden registrada.' : 'Sin resultados para la búsqueda.'}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-tinta">Comprador</TableHead>
                <TableHead className="font-bold text-tinta">ebook</TableHead>
                <TableHead className="font-bold text-tinta">Precio</TableHead>
                <TableHead className="font-bold text-tinta">Estado</TableHead>
                <TableHead className="font-bold text-tinta">Fecha</TableHead>
                <TableHead className="text-right font-bold text-tinta">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((f) => (
                <TableRow key={f.id} className="hover:bg-muted transition-colors">
                  <TableCell className="text-sm text-tinta">{f.email}</TableCell>
                  <TableCell className="text-sm text-tinta">{f.ebookTitulo}</TableCell>
                  <TableCell className="text-sm text-tinta">{formatoARS.format(f.precioCentavos / 100)}</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ESTILO_ESTADO[f.estado]}`}>
                      {LABEL_ESTADO[f.estado]}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {fechaCorta(f.fecha)}
                  </TableCell>
                  <TableCell className="text-right">
                    {f.estado === 'pendiente' && (
                      <Button
                        variant="ghost" size="sm" onClick={() => setAConfirmar(f)} disabled={isPending}
                        className="h-8 px-2 text-marca hover:bg-marca/10"
                        title="Confirmar que el pago entró"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    {f.estado === 'pagada' && (
                      <Button
                        variant="ghost" size="sm" onClick={() => setAReembolsar(f)} disabled={isPending}
                        className="h-8 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Marcar como reembolsada"
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!aConfirmar} onOpenChange={(o) => !o && setAConfirmar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Confirmás que el pago entró?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Antes de confirmar, chequeá en tu cuenta de Mercado Pago que estén los{' '}
              <b>{aConfirmar ? formatoARS.format(aConfirmar.precioCentavos / 100) : ''}</b> de{' '}
              <b>{aConfirmar?.email}</b>. Esto no cobra nada: le habilita a esa persona la
              descarga de <b>{aConfirmar?.ebookTitulo}</b> y le manda el link por mail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleConfirmar() }} disabled={isPending} className="bg-marca hover:bg-marca/90 text-crema">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!aReembolsar} onOpenChange={(o) => !o && setAReembolsar(null)}>
        <AlertDialogContent className="bg-crema">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl text-tinta">¿Marcar como reembolsada?</AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-muted-foreground">
              Esto <b>no</b> devuelve la plata — eso se hace desde el panel de Mercado Pago.
              Solo registra acá que se reembolsó, y con eso <b>{aReembolsar?.email}</b> deja
              de poder volver a descargar <b>{aReembolsar?.ebookTitulo}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleReembolsar() }} disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Marcar reembolsada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
