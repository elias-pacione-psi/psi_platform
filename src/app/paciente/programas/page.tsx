import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LayoutList } from 'lucide-react'
import Link from 'next/link'

export default async function ProgramasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Join mediante la tabla puente, filtrando explícitamente por el usuario
  const { data: programasAsignados } = await supabase
    .from('programas_asignados')
    .select('programas(*)')
    .eq('paciente_id', user?.id)

  // Aplanar el arreglo de la relación
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programas = programasAsignados?.map((m: any) => m.programas).filter(Boolean) || []

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-heading font-bold text-tinta">
          Mis programas
        </h1>
        <p className="text-lg font-sans text-tinta/70 mt-2">
          El contenido que tu psicólogo armó para vos, paso a paso.
        </p>
      </div>

      {programas && programas.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programas.map((programa) => (
            <Card key={programa.id} className="border-none shadow-md flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="font-heading text-2xl text-tinta line-clamp-2">{programa.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="font-sans text-base mb-6 flex-1 line-clamp-3">
                  {programa.descripcion}
                </CardDescription>
                <Link href={`/paciente/programas/${programa.id}`} className="mt-auto">
                  <Button className="w-full bg-tinta hover:bg-tinta/90 text-white font-sans">
                    <LayoutList className="w-4 h-4 mr-2" />
                    Ver contenido
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white border-none shadow-sm rounded-xl p-12 text-center">
          <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-heading font-bold text-tinta mb-2">Aún no hay programas</h3>
          <p className="text-muted-foreground font-sans max-w-md mx-auto">
            Todavía no tenés programas asignados. Tu psicólogo va a habilitarte el contenido cuando corresponda.
          </p>
        </div>
      )}
    </div>
  )
}
