'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, CheckCircle2, MessageSquare } from 'lucide-react'
import { registrarEntrega } from '@/app/alumno/actions'
import { subirEntregaAR2 } from '@/lib/subida-r2'
import { toast } from 'sonner'

type Entrega = { archivo_url: string, comentario_alumno: string | null, estado: string, comentario_instructor: string | null } | null

export function EntregaForm({ leccionId, programaId, entrega }: { leccionId: string, programaId: string, entrega: Entrega }) {
  const [file, setFile] = useState<File | null>(null)
  const [comentario, setComentario] = useState(entrega?.comentario_alumno || '')
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [enviada, setEnviada] = useState(!!entrega)

  const subir = () => {
    if (!file && !entrega) { toast.error('Elegí un archivo para entregar.'); return }
    startTransition(async () => {
      let archivoPath = entrega?.archivo_url || ''
      if (file) {
        setUploading(true)
        const subida = await subirEntregaAR2(file, leccionId)
        setUploading(false)
        if ('error' in subida) { toast.error(subida.error); return }
        archivoPath = subida.key
      }
      const r = await registrarEntrega(leccionId, programaId, archivoPath, comentario)
      if (r?.error) toast.error(r.error)
      else { toast.success('¡Trabajo entregado!'); setEnviada(true); setFile(null) }
    })
  }

  return (
    <div className="space-y-4">
      {entrega?.estado === 'revisada' && entrega.comentario_instructor && (
        <div className="bg-marca/5 border border-marca/30 rounded-xl p-4">
          <p className="text-sm font-bold text-tinta flex items-center gap-1.5 mb-1"><MessageSquare className="w-4 h-4 text-marca" /> Devolución del instructor</p>
          <p className="text-sm text-tinta whitespace-pre-wrap">{entrega.comentario_instructor}</p>
        </div>
      )}

      {enviada && (
        <div className="flex items-center gap-2 text-marca font-semibold text-sm">
          <CheckCircle2 className="w-5 h-5" /> Trabajo entregado{entrega?.estado === 'revisada' ? ' y revisado' : ' (pendiente de revisión)'}.
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-bold text-tinta">{enviada ? 'Reemplazar archivo (opcional)' : 'Archivo a entregar'}</label>
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-card border-border cursor-pointer" disabled={isPending} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-tinta">Comentario (opcional)</label>
        <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} className="bg-card border-border h-24" placeholder="Aclaraciones sobre tu entrega..." disabled={isPending} />
      </div>
      <Button onClick={subir} disabled={isPending || uploading} className="bg-marca hover:bg-marca/90 text-crema h-12 px-8 rounded-xl">
        {isPending || uploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
        {enviada ? 'Actualizar entrega' : 'Entregar trabajo'}
      </Button>
    </div>
  )
}
