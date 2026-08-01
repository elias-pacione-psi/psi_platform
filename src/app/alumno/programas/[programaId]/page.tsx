import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PlayCircle, FileText, FileAudio, FileVideo, CheckCircle, ListChecks, ClipboardCheck, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default async function ProgramaDetallePage(props: { params: Promise<{ programaId: string }> }) {
  const params = await props.params
  const programaId = params.programaId
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: programa, error: progError } = await supabase
    .from('programas').select('*').eq('id', programaId).single()
  if (progError || !programa) redirect('/alumno/programas')

  const [{ data: asignacion }, { data: perfil }] = await Promise.all([
    supabase.from('programas_asignados').select('programa_id').eq('alumno_id', user?.id).eq('programa_id', programaId).maybeSingle(),
    supabase.from('alumnos').select('rol').eq('id', user?.id).single(),
  ])
  if (!asignacion && perfil?.rol !== 'psicologo') redirect('/alumno/programas')

  const [{ data: modulos }, { data: lecciones }, { data: progresos }] = await Promise.all([
    supabase.from('modulos').select('*').eq('programa_id', programaId).order('orden', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('lecciones').select('id, titulo, tipo_contenido, modulo_id, orden').eq('programa_id', programaId).order('orden', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('progreso_lecciones').select('leccion_id').eq('alumno_id', user?.id).eq('completado', true),
  ])

  const completadas = new Set((progresos || []).map(p => p.leccion_id))
  const total = lecciones?.length || 0
  const hechas = (lecciones || []).filter(l => completadas.has(l.id)).length
  const porcentaje = total === 0 ? 0 : Math.round((hechas / total) * 100)

  const getIcon = (tipo: string) => {
    if (tipo === 'quiz') return <ListChecks className="w-5 h-5 text-marca" />
    if (tipo === 'entrega') return <ClipboardCheck className="w-5 h-5 text-marca" />
    if (tipo.includes('video')) return <FileVideo className="w-5 h-5 text-marca" />
    if (tipo.includes('audio')) return <FileAudio className="w-5 h-5 text-marca" />
    if (tipo.includes('image')) return <ImageIcon className="w-5 h-5 text-marca" />
    if (tipo.includes('pdf') || tipo === 'texto_markdown') return <FileText className="w-5 h-5 text-marca" />
    return <PlayCircle className="w-5 h-5 text-marca" />
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">{programa.titulo}</h1>
        <p className="text-lg font-sans text-tinta/70 mt-2">{programa.descripcion}</p>
      </div>

      {total > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <div className="flex justify-between items-center text-sm font-medium text-tinta mb-2">
            <span>Tu progreso en el curso</span>
            <span>{hechas} de {total} lecciones · {porcentaje}%</span>
          </div>
          <Progress value={porcentaje} className="h-3 w-full bg-tinta/10" />
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-8">
        <h2 className="text-2xl font-heading font-semibold text-tinta mb-6">Contenido del programa</h2>

        {modulos && modulos.length > 0 ? (
          <Accordion className="w-full space-y-4">
            {modulos.map((modulo) => {
              const items = lecciones?.filter(l => l.modulo_id === modulo.id && l.tipo_contenido !== 'entrega') || []
              const hechasMod = items.filter(l => completadas.has(l.id)).length
              return (
                <AccordionItem key={modulo.id} value={modulo.id} className="border border-border rounded-xl px-4 bg-muted/50 data-[state=open]:bg-card data-[state=open]:shadow-md transition-all">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-col items-start text-left">
                      <span className="font-heading font-bold text-xl text-tinta">{modulo.titulo}</span>
                      {modulo.descripcion && <span className="font-sans text-sm text-muted-foreground mt-1 font-normal line-clamp-1">{modulo.descripcion}</span>}
                      <span className="text-xs text-marca font-semibold mt-1">{hechasMod}/{items.length} completadas</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 border-t border-border">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">No hay lecciones en este módulo aún.</p>
                    ) : (
                      <div className="grid gap-3 mt-4">
                        {items.map((leccion) => {
                          const done = completadas.has(leccion.id)
                          return (
                            <Link href={`/alumno/programas/${programa.id}/leccion/${leccion.id}`} key={leccion.id}>
                              <Card className={`border-border hover:border-marca/50 hover:shadow-md hover:bg-muted transition-all duration-200 cursor-pointer group ${done ? 'bg-marca/5' : ''}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-marca/15' : 'bg-crema group-hover:bg-marca/10'}`}>
                                      {done ? <CheckCircle className="w-5 h-5 text-marca" /> : getIcon(leccion.tipo_contenido)}
                                    </div>
                                    <h3 className={`font-sans font-semibold text-base transition-colors ${done ? 'text-marca' : 'text-tinta group-hover:text-marca'}`}>{leccion.titulo}</h3>
                                  </div>
                                  <Button variant="ghost" className="text-marca opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PlayCircle className="w-5 h-5 mr-2" /> Entrar
                                  </Button>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <div className="bg-muted border border-border rounded-xl p-8 text-center text-muted-foreground">
            Aún no hay módulos estructurados para este programa.
          </div>
        )}

        {/* Trabajo Final Integrador (Entregas) */}
        {lecciones?.filter(l => l.tipo_contenido === 'entrega').map(entrega => (
          <div key={entrega.id} className="mt-8">
            <Card className="border border-border rounded-xl bg-card shadow-sm">
              <CardContent className="p-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-marca/10 text-marca rounded-full flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-tinta">{entrega.titulo}</h3>
                  </div>
                </div>
                <Link href={`/alumno/programas/${programa.id}/leccion/${entrega.id}`}>
                  <Button className="w-full md:w-auto bg-tinta text-crema hover:bg-marca transition-colors rounded-full px-8 py-5 text-base">
                    Abrir
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
