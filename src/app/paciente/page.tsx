import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutList, FolderHeart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { JoinMeetButton } from './JoinMeetButton'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PacienteHomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Consultas independientes en paralelo
  const [{ data: paciente }, { data: proximaSesion }, { count: cantidadProgramas }, { count: cantidadMateriales }] = await Promise.all([
    supabase
      .from('pacientes')
      .select('nombre, link_videollamada')
      .eq('id', user?.id)
      .single(),
    supabase
      .from('agenda_sesiones')
      .select('fecha_hora')
      .eq('paciente_id', user?.id)
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('programas_asignados')
      .select('*', { count: 'exact', head: true })
      .eq('paciente_id', user?.id),
    supabase
      .from('recursos_asignados')
      .select('*', { count: 'exact', head: true })
      .eq('paciente_id', user?.id),
  ])

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">
          Hola, {paciente?.nombre || 'Paciente'}
        </h1>
        <p className="text-lg font-sans text-tinta/70 mt-2">
          Bienvenido a tu espacio. Acá está el material que tu psicólogo preparó para vos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-tinta">Tu próxima sesión</CardTitle>
            <CardDescription className="font-sans text-base">
              Fecha de tu próximo encuentro y acceso a la videollamada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proximaSesion?.fecha_hora ? (
              <div className="mb-4 p-4 bg-crema rounded-xl border border-tinta/10">
                <p className="text-tinta font-serif font-medium text-center">
                  Tu próxima sesión es el{' '}
                  <span className="font-bold">
                    {new Date(proximaSesion.fecha_hora).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>{' '}
                  a las{' '}
                  <span className="font-bold">
                    {new Date(proximaSesion.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                  </span>
                </p>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-crema rounded-xl border border-tinta/10 text-center">
                <p className="text-muted-foreground font-sans text-sm">No hay sesiones agendadas por ahora.</p>
              </div>
            )}

            {paciente?.link_videollamada ? (
              <JoinMeetButton linkVideollamada={paciente.link_videollamada} />
            ) : (
              <div className="bg-crema/60 border border-tinta/10 rounded-xl p-6 text-center mt-4">
                <p className="text-muted-foreground font-sans">
                  Tu enlace de videollamada aún no fue configurado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-tinta">Tu material</CardTitle>
            <CardDescription className="font-sans text-base">
              Contenido asignado para trabajar entre sesiones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/paciente/programas" className="flex items-center justify-between p-4 bg-crema rounded-xl border border-tinta/10 hover:border-marca/40 hover:shadow-sm transition-all group">
              <span className="flex items-center gap-3">
                <LayoutList className="w-5 h-5 text-marca" />
                <span className="font-sans font-semibold text-tinta">
                  {cantidadProgramas || 0} {cantidadProgramas === 1 ? 'programa asignado' : 'programas asignados'}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors" />
            </Link>
            <Link href="/paciente/materiales" className="flex items-center justify-between p-4 bg-crema rounded-xl border border-tinta/10 hover:border-marca/40 hover:shadow-sm transition-all group">
              <span className="flex items-center gap-3">
                <FolderHeart className="w-5 h-5 text-marca" />
                <span className="font-sans font-semibold text-tinta">
                  {cantidadMateriales || 0} {cantidadMateriales === 1 ? 'material de apoyo' : 'materiales de apoyo'}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-tinta/40 group-hover:text-marca transition-colors" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
