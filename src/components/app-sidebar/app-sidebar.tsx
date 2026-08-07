'use client'

import { useState } from "react"
import { Home, LogOut, Users, Library, Calendar, LayoutList, GraduationCap, Inbox, ClipboardList, FolderCog, BookOpen, ShoppingBag, ChevronDown } from "lucide-react"
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
    // Mismo nombre e ícono que "Biblioteca" del panel del psicólogo: es la misma
    // sección vista desde el otro lado, y llamarla distinto hacía parecer que eran
    // dos cosas.
    title: "Biblioteca",
    url: "/alumno/materiales",
    icon: Library,
  },
  {
    // Solo tiene contenido para quien creó una cuenta después de comprar un ebook (fase
    // 5 del modelo comercial) — para el resto queda con la lista vacía, igual que
    // Entregas o Agenda si todavía no hay nada cargado.
    title: "Mis compras",
    url: "/alumno/compras",
    icon: ShoppingBag,
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
    title: "Comisiones",
    url: "/psicologo/cohortes",
    icon: GraduationCap,
  },
  {
    // El único producto con venta directa (ver docs/plan-modelo-comercial.md). Ventas
    // vive acá adentro como pestaña: al ser el único producto que se vende, "las ventas"
    // siempre fueron ventas de ebooks.
    title: "ebooks",
    url: "/psicologo/ebooks",
    icon: BookOpen,
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
  // Cerrado por defecto: es una vista previa de lo que ve un alumno, no una sección de
  // trabajo del psicólogo. Abierta siempre, repetía "Inicio"/"Biblioteca" dos veces en
  // la misma pantalla y se leía como si el panel tuviera secciones duplicadas.
  const [alumnoAbierto, setAlumnoAbierto] = useState(false)

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
              <SidebarGroupLabel
                className="text-tinta/70 flex items-center justify-between cursor-pointer select-none"
                onClick={() => setAlumnoAbierto((v) => !v)}
                role="button"
                tabIndex={0}
                aria-expanded={alumnoAbierto}
              >
                <span>Vista previa de alumno</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${alumnoAbierto ? 'rotate-180' : ''}`} />
              </SidebarGroupLabel>
              {alumnoAbierto && (
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
              )}
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
