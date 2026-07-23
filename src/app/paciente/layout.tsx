import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { createClient } from '@/utils/supabase/server'

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = 'paciente'
  if (user) {
    const { data: paciente } = await supabase
      .from('pacientes')
      .select('rol, estado')
      .eq('id', user.id)
      .single()

    if (paciente) {
      if (paciente.estado === 'suspendido') {
        return (
          <div className="flex h-screen w-full items-center justify-center bg-crema px-6 text-center">
            <h1 className="text-2xl font-bold text-red-600">Tu cuenta está suspendida. Comunicate con tu psicólogo.</h1>
          </div>
        )
      }
      userRole = paciente.rol || 'paciente'
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <main className="flex-1 min-h-screen bg-crema/30 overflow-x-hidden flex flex-col">
        <div className="p-4 flex items-center border-b border-gray-200 bg-white sticky top-0 z-10 shrink-0">
          <SidebarTrigger className="text-tinta" />
        </div>
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
