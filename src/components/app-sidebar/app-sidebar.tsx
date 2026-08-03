'use client'

import { Home, LogOut, Users, FolderHeart, Library, Calendar, LayoutList, GraduationCap, Inbox, ClipboardList, FolderCog } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { BrandLogo } from "@/components/BrandLogo"
import { ThemeToggle } from "@/components/ThemeToggle"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const itemsAlumno = [
  {
    title: "Inicio",
    url: "/alumno",
    icon: Home,
  },
  {
    title: "Mis programas",
    url: "/alumno/programas",
    icon: LayoutList,
  },
  {
    title: "Materiales",
    url: "/alumno/materiales",
    icon: FolderHeart,
  },
  {
    title: "Tareas",
    url: "/alumno/tareas",
    icon: ClipboardList,
  },
  {
    title: "Mi agenda",
    url: "/alumno/agenda",
    icon: Calendar,
  },
]

const itemsPsicologo = [
  {
    title: "Inicio",
    url: "/psicologo",
    icon: Home,
  },
  {
    title: "Alumnos",
    url: "/psicologo/alumnos",
    icon: Users,
  },
  {
    title: "Programas",
    url: "/psicologo/programas",
    icon: LayoutList,
  },
  {
    title: "Cohortes",
    url: "/psicologo/cohortes",
    icon: GraduationCap,
  },
  {
    title: "Entregas",
    url: "/psicologo/entregas",
    icon: Inbox,
  },
  {
    title: "Biblioteca",
    url: "/psicologo/biblioteca",
    icon: Library,
  },
  {
    title: "Archivos",
    url: "/psicologo/archivos",
    icon: FolderCog,
  },
  {
    title: "Agenda",
    url: "/psicologo/agenda",
    icon: Calendar,
  },
]

// El item raíz de cada sección ("/psicologo", "/alumno") se marca activo solo en su
// propia URL: con startsWith a secas, "Inicio" quedaría prendido en todas las páginas de
// la sección al mismo tiempo que el item real.
function estaActivo(pathname: string, url: string, raiz: string) {
  return pathname === url || (url !== raiz && pathname.startsWith(url))
}

export function AppSidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const esPsicologo = userRole === 'psicologo'

  return (
    <Sidebar className="border-r-gray-200">
      <SidebarHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
        <BrandLogo />
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent>
        {esPsicologo ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-tinta/70">Panel del psicólogo</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemsPsicologo.map((item) => {
                    const isActive = estaActivo(pathname, item.url, "/psicologo")
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton isActive={isActive} className="font-sans hover:bg-crema hover:text-marca data-[active=true]:bg-crema data-[active=true]:text-marca data-[active=true]:font-bold transition-all duration-200">
                          <Link href={item.url} className="flex items-center gap-2 w-full">
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-tinta/70 flex items-center justify-between">
                <span>Alumno</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {itemsAlumno.map((item) => {
                    const isActive = estaActivo(pathname, item.url, "/alumno")
                    return (
                      <SidebarMenuItem key={`demo-${item.title}`}>
                        <SidebarMenuButton isActive={isActive} className="font-sans hover:bg-crema hover:text-marca data-[active=true]:bg-crema data-[active=true]:text-marca data-[active=true]:font-bold transition-all duration-200">
                          <Link href={item.url} className="flex items-center gap-2 w-full">
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel className="text-tinta/70">Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsAlumno.map((item) => {
                  const isActive = estaActivo(pathname, item.url, "/alumno")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton isActive={isActive} className="font-sans hover:bg-crema hover:text-marca data-[active=true]:bg-crema data-[active=true]:text-marca data-[active=true]:font-bold transition-all duration-200">
                        <Link href={item.url} className="flex items-center gap-2 w-full">
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="font-sans text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
