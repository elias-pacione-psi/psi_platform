import { createClient } from '@/utils/supabase/server'
import { Star, MessageSquareHeart } from 'lucide-react'

// Feedback privado de los alumnos sobre el material. Solo lectura: el psicólogo no
// puede editar ni borrar opiniones (tampoco hay policy que se lo permita, ver el
// snippet 2026-08-09-opiniones-curso.sql). Poder retocarlas volvería ficción el
// feedback.

type OpinionFila = {
  id: string
  puntuacion: number
  lo_que_sirvio: string | null
  lo_que_mejoraria: string | null
  created_at: string
  alumnos: { nombre: string } | null
  programas: { titulo: string } | null
}

function Estrellas({ n, className = 'w-4 h-4' }: { n: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${n} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= n ? 'fill-marca text-marca' : 'text-muted-foreground/40'}`} />
      ))}
    </span>
  )
}

const formatoFecha = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

export default async function OpinionesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('opiniones_curso')
    .select('id, puntuacion, lo_que_sirvio, lo_que_mejoraria, created_at, alumnos(nombre), programas(titulo)')
    .order('created_at', { ascending: false })

  const opiniones = (data ?? []) as unknown as OpinionFila[]

  // Promedio por curso, para ver de un vistazo cuál está funcionando mejor.
  const porCurso = new Map<string, { suma: number; cantidad: number }>()
  for (const o of opiniones) {
    const titulo = o.programas?.titulo ?? 'Curso eliminado'
    const acc = porCurso.get(titulo) ?? { suma: 0, cantidad: 0 }
    porCurso.set(titulo, { suma: acc.suma + o.puntuacion, cantidad: acc.cantidad + 1 })
  }
  const resumen = [...porCurso.entries()]
    .map(([titulo, { suma, cantidad }]) => ({ titulo, promedio: suma / cantidad, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)

  const promedioGeneral =
    opiniones.length > 0 ? opiniones.reduce((s, o) => s + o.puntuacion, 0) / opiniones.length : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Opiniones</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Lo que los alumnos respondieron sobre tus cursos. Es privado: solo lo ves vos.
        </p>
      </div>

      {opiniones.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <MessageSquareHeart className="w-10 h-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="text-lg font-bold text-tinta">Todavía no hay opiniones</h2>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            Cuando un alumno con un curso asignado responda la encuesta del final, sus
            respuestas aparecen acá.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Promedio general</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-heading font-bold text-tinta">{promedioGeneral.toFixed(1)}</span>
                <Estrellas n={Math.round(promedioGeneral)} />
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Respuestas</p>
              <span className="text-3xl font-heading font-bold text-tinta">{opiniones.length}</span>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Cursos con feedback</p>
              <span className="text-3xl font-heading font-bold text-tinta">{resumen.length}</span>
            </div>
          </div>

          {resumen.length > 1 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading font-semibold text-tinta mb-4">Por curso</h2>
              <div className="space-y-3">
                {resumen.map((r) => (
                  <div key={r.titulo} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-tinta truncate">{r.titulo}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <Estrellas n={Math.round(r.promedio)} className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium text-tinta tabular-nums">{r.promedio.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({r.cantidad})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {opiniones.map((o) => (
              <div key={o.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <Estrellas n={o.puntuacion} />
                    <span className="font-medium text-tinta">{o.alumnos?.nombre ?? 'Alumno eliminado'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {o.programas?.titulo ?? 'Curso eliminado'} · {formatoFecha.format(new Date(o.created_at))}
                  </span>
                </div>
                {o.lo_que_sirvio && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Qué le sirvió</p>
                    <p className="text-sm text-tinta/85 leading-relaxed whitespace-pre-line">{o.lo_que_sirvio}</p>
                  </div>
                )}
                {o.lo_que_mejoraria && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Qué mejoraría</p>
                    <p className="text-sm text-tinta/85 leading-relaxed whitespace-pre-line">{o.lo_que_mejoraria}</p>
                  </div>
                )}
                {!o.lo_que_sirvio && !o.lo_que_mejoraria && (
                  <p className="text-sm text-muted-foreground italic">Puntuó sin dejar comentarios.</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
