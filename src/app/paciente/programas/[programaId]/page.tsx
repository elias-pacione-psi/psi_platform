import { createClient } from '@/utils/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayCircle, FileText, FileAudio, FileVideo, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default async function ProgramaDetallePage(props: { params: Promise<{ programaId: string }> }) {
  const params = await props.params;
  const programaId = params.programaId;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: programa, error: progError } = await supabase
    .from('programas')
    .select('*')
    .eq('id', programaId)
    .single()

  if (progError || !programa) {
    redirect('/paciente/programas')
  }

  // Solo se puede acceder a programas asignados (o siendo el psicólogo)
  const [{ data: asignacion }, { data: perfil }] = await Promise.all([
    supabase
      .from('programas_asignados')
      .select('programa_id')
      .eq('paciente_id', user?.id)
      .eq('programa_id', programaId)
      .maybeSingle(),
    supabase
      .from('pacientes')
      .select('rol')
      .eq('id', user?.id)
      .single(),
  ])

  if (!asignacion && perfil?.rol !== 'psicologo') {
    redirect('/paciente/programas')
  }

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('programa_id', programaId)
    .order('created_at', { ascending: true })

  const { data: actividades } = await supabase
    .from('actividades')
    .select('*')
    .eq('programa_id', programaId)
    .order('created_at', { ascending: true })

  const getIcon = (tipo: string) => {
    if (tipo.includes('video')) return <FileVideo className="w-5 h-5 text-marca" />;
    if (tipo.includes('audio')) return <FileAudio className="w-5 h-5 text-marca" />;
    if (tipo.includes('pdf') || tipo === 'texto_markdown') return <FileText className="w-5 h-5 text-marca" />;
    if (tipo.includes('image')) return <ImageIcon className="w-5 h-5 text-marca" />;
    return <PlayCircle className="w-5 h-5 text-marca" />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">
          {programa.titulo}
        </h1>
        <p className="text-lg font-sans text-tinta/70 mt-2">
          {programa.descripcion}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-8">
        <h2 className="text-2xl font-heading font-semibold text-tinta mb-6">Contenido del programa</h2>

        {unidades && unidades.length > 0 ? (
          <Accordion className="w-full space-y-4">
            {unidades.map((unidad) => {
              const materiales = actividades?.filter(l => l.unidad_id === unidad.id) || []
              return (
                <AccordionItem key={unidad.id} value={unidad.id} className="border border-gray-200 rounded-xl px-4 bg-gray-50/50 data-[state=open]:bg-white data-[state=open]:shadow-md transition-all">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-col items-start text-left">
                      <span className="font-heading font-bold text-xl text-tinta">{unidad.titulo}</span>
                      {unidad.descripcion && <span className="font-sans text-sm text-muted-foreground mt-1 font-normal line-clamp-1">{unidad.descripcion}</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4 border-t border-gray-100">
                    {materiales.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic py-2">No hay material asignado a esta unidad aún.</p>
                    ) : (
                      <div className="grid gap-3 mt-4">
                        {materiales.map((material) => (
                          <Link href={`/paciente/programas/${programa.id}/actividad/${material.id}`} key={material.id}>
                            <Card className="border-gray-200 hover:border-marca/50 hover:shadow-md hover:bg-slate-50 transition-all duration-200 cursor-pointer group">
                              <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-crema group-hover:bg-marca/10">
                                    {getIcon(material.tipo_contenido)}
                                  </div>
                                  <div>
                                    <h3 className="font-sans font-semibold text-base transition-colors text-tinta group-hover:text-marca">
                                      {material.titulo}
                                    </h3>
                                  </div>
                                </div>
                                <Button variant="ghost" className="text-marca opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayCircle className="w-5 h-5 mr-2" />
                                  Entrar
                                </Button>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center text-muted-foreground">
            Aún no hay unidades estructuradas para este programa.
          </div>
        )}
      </div>

    </div>
  )
}
