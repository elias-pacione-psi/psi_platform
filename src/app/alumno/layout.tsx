import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { createClient } from '@/utils/supabase/server'

export default async function AlumnoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = 'alumno'
  if (user) {
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('rol, estado')
      .eq('id', user.id)
      .single()

    if (alumno) {
      // Se compara contra 'activo' y no contra 'suspendido': cambiarEstadoAlumno() no
      // borra la fila cuando el estado pasa a 'eliminado', sólo actualiza la columna, así
      // que preguntar por el estado malo dejaba pasar a los eliminados. La lista de
      // estados bloqueados no hay que mantenerla; la de permitidos sí, y es uno solo.
      if (alumno.estado !== 'activo') {
        return (
          <div className="flex h-screen w-full items-center justify-center bg-crema px-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">Tu cuenta no está activa. Comunicate con tu psicólogo.</h1>
          </div>
        )
      }
      userRole = alumno.rol || 'alumno'
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <main className="flex-1 min-h-screen bg-crema/30 overflow-x-hidden flex flex-col">
        <div className="p-4 flex items-center border-b border-border bg-card sticky top-0 z-10 shrink-0">
          <SidebarTrigger className="text-tinta" />
        </div>
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
