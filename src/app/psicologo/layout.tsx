import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar/app-sidebar"
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: alumno } = await supabase
    .from('alumnos')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (!alumno || alumno.rol !== 'psicologo') {
    redirect('/alumno')
  }

  return (
    <SidebarProvider>
      <AppSidebar userRole="psicologo" />
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
