'use client'

import { Home, LogOut, Users, FolderHeart, Library, Calendar, LayoutList } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { BrandLogo } from "@/components/BrandLogo"

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

const itemsPaciente = [
  {
    title: "Inicio",
    url: "/paciente",
    icon: Home,
  },
  {
    title: "Mis programas",
    url: "/paciente/programas",
    icon: LayoutList,
  },
  {
    title: "Materiales",
    url: "/paciente/materiales",
    icon: FolderHeart,
  },
  {
    title: "Mi agenda",
    url: "/paciente/agenda",
    icon: Calendar,
  },
]

const itemsPsicologo = [
  {
    title: "Pacientes",
    url: "/psicologo/pacientes",
    icon: Users,
  },
  {
    title: "Programas",
    url: "/psicologo/programas",
    icon: LayoutList,
  },
  {
    title: "Biblioteca",
    url: "/psicologo/biblioteca",
    icon: Library,
  },
  {
    title: "Agenda",
    url: "/psicologo/agenda",
    icon: Calendar,
  },
]

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
      <SidebarHeader className="p-4 border-b border-gray-100 flex items-center justify-center">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>
        {!esPsicologo && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-tinta/70">Navegación</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsPaciente.map((item) => {
                  const isActive = pathname === item.url || (item.url !== "/paciente" && pathname.startsWith(item.url))
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

        {esPsicologo && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-tinta/70">Panel del psicólogo</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {itemsPsicologo.map((item) => {
                  const isActive = pathname.startsWith(item.url)
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
      <SidebarFooter className="p-4 border-t border-gray-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="font-sans text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
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
