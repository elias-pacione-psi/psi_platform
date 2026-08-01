import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CheckCircle2, Clock, AlertTriangle, MessageSquare, ClipboardList } from 'lucide-react'

export const metadata = { title: 'Tareas' }

type ProgramaJoin = { titulo: string } | null

type LeccionEntrega = {
  id: string
  titulo: string
  fecha_limite: string | null
  programa_id: string
  programas: ProgramaJoin
}

type Entrega = {
  leccion_id: string
  estado: string
  comentario_instructor: string | null
}

export default async function TareasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: perfil } = await supabase.from('alumnos').select('rol').eq('id', user?.id).single()
  const esPsicologo = perfil?.rol === 'psicologo'

  // El psicólogo ve todos los trabajos de todos los programas (vista de control);
  // el alumno solo los de los programas que tiene asignados.
  let programaIds: string[] = []
  if (esPsicologo) {
    const { data: todos } = await supabase.from('programas').select('id')
    programaIds = (todos || []).map((p) => p.id)
  } else {
    const { data: asignados } = await supabase
      .from('programas_asignados')
      .select('programa_id')
      .eq('alumno_id', user?.id)
    programaIds = (asignados || []).map((a) => a.programa_id)
  }

  let lecciones: LeccionEntrega[] = []
  if (programaIds.length > 0) {
    const { data } = await supabase
      .from('lecciones')
      .select('id, titulo, fecha_limite, programa_id, programas(titulo)')
      .eq('tipo_contenido', 'entrega')
      .in('programa_id', programaIds)
      .order('fecha_limite', { ascending: true, nullsFirst: false })
    // Postgrest devuelve un objeto único en este join a-uno; sin tipos generados
    // de Supabase, el cliente lo infiere como array — mismo cast que en
    // alumno/programas/page.tsx para reflejar el shape real.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lecciones = (data as any as LeccionEntrega[]) || []
  }

  const { data: entregasData } = await supabase
    .from('entregas')
    .select('leccion_id, estado, comentario_instructor')
    .eq('alumno_id', user?.id)
  const entregasPorLeccion = new Map<string, Entrega>((entregasData || []).map((e) => [e.leccion_id, e]))

  const tareas = lecciones.map((l) => ({ ...l, entrega: entregasPorLeccion.get(l.id) || null }))

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">Tareas</h1>
        <p className="text-muted-foreground mt-2 font-sans">
          Todos los trabajos que tu psicólogo asignó, de todos tus programas, en un solo lugar.
        </p>
      </div>

      {tareas.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl shadow-sm p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold text-tinta mb-2">Sin trabajos asignados</h3>
          <p className="text-muted-foreground font-sans">Todavía no tenés ninguna entrega pendiente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tareas.map((t) => {
            const entregado = !!t.entrega
            const revisada = t.entrega?.estado === 'revisada'
            const vencida = !entregado && !!t.fecha_limite && new Date(t.fecha_limite) < new Date()

            return (
              <Link
                key={t.id}
                href={`/alumno/programas/${t.programa_id}/leccion/${t.id}`}
                className={`block p-5 rounded-2xl border transition-colors ${
                  revisada
                    ? 'bg-marca/5 border-marca/30'
                    : entregado
                      ? 'bg-muted border-border'
                      : vencida
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-900'
                        : 'bg-card border-border hover:border-marca/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 truncate">
                      {t.programas?.titulo}
                    </p>
                    <h3 className={`font-heading font-bold text-lg text-tinta ${entregado ? 'line-through text-muted-foreground' : ''}`}>
                      {t.titulo}
                    </h3>
                  </div>
                  <div className="shrink-0">
                    {revisada ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-marca/10 text-marca">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Revisada
                      </span>
                    ) : entregado ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">
                        <Clock className="w-3.5 h-3.5" /> Entregada
                      </span>
                    ) : vencida ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> Vencida
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {t.fecha_limite && (
                  <p className={`text-xs mt-2 ${vencida ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'}`}>
                    Vence: {new Date(t.fecha_limite).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {revisada && t.entrega?.comentario_instructor && (
                  <p className="text-sm text-tinta/80 mt-3 flex items-start gap-1.5 bg-card rounded-lg p-3 border border-border">
                    <MessageSquare className="w-4 h-4 text-marca shrink-0 mt-0.5" />
                    <span>{t.entrega.comentario_instructor}</span>
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
