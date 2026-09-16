'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from '@/components/BrandMark'
import { ThemeToggle } from '@/components/ThemeToggle'

// Mismo header en todas las páginas públicas (landing, ebooks, cursos, formaciones,
// supervisiones, terapia individual). Antes cada una tenía su propia versión
// achicada (ebooks sin lema ni nav; las de servicio solo con un link de texto) y se
// desincronizaban. Con un solo componente compartido hay un único lugar que mantener.
//
// Es client component sólo por usePathname(): sin saber en qué ruta estamos no se puede
// marcar la sección activa, que era el punto 5 del feedback ("recalcar con algún color
// el tema en el que estás, o poner un óvalo blanco para que quede seleccionado").
// Reunión con el psicólogo (minuta del 2026-09-15): el problema de fondo era que
// "los profesionales no entienden qué es para quién". Formaciones sale de la barra y
// pasa a vivir dentro de Supervisiones, que queda como la puerta de entrada de todo lo
// dirigido a profesionales (supervisión + formaciones + cursos dedicados). Cursos queda
// como la oferta para público general. La página /formaciones sigue existiendo y se
// llega desde Supervisiones — por eso `rutasRelacionadas`, para que estando ahí la barra
// igual marque Supervisiones y no deje a la persona sin saber dónde está parada.
const SECCIONES_NAV: { titulo: string; href: string; rutasRelacionadas?: string[] }[] = [
  { titulo: 'ebooks', href: '/ebooks' },
  { titulo: 'Cursos', href: '/cursos' },
  { titulo: 'Supervisiones', href: '/supervisiones', rutasRelacionadas: ['/formaciones'] },
  { titulo: 'Terapia individual', href: '/terapia-individual' },
  { titulo: 'Psicología y Fe', href: '/psicologia-y-fe' },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    // max-w-7xl (antes 6xl) y padding lateral mayor en escritorio: el bloque entero
    // arrancaba muy adentro de la pantalla y el logo quedaba flotando lejos del borde
    // — puntos 1 y 2 del feedback.
    <header className="w-full sticky top-0 z-50 bg-crema/85 backdrop-blur-sm border-b border-border px-5 sm:px-6 lg:px-10 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link href="/" className="flex items-center gap-3 shrink-0 rounded-lg transition-opacity hover:opacity-80">
          {/* Isotipo más grande y a contraste pleno (antes text-tinta a tamaño menor):
              "entrás y a primera vista no resalta nada en específico". */}
          <BrandMark className="w-14 h-9 shrink-0 text-tinta" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading font-semibold text-lg sm:text-xl tracking-tight text-tinta">Elias Pacione</span>
            <span className="hidden sm:block font-serif text-xs text-muted-foreground -mt-0.5">Psicología con sentido.</span>
          </span>
        </Link>

        <div className="order-last w-full relative lg:order-none lg:w-auto lg:flex-1">
          <nav className="flex items-center gap-1 overflow-x-auto lg:justify-end lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECCIONES_NAV.map((seccion) => {
              const activo = [seccion.href, ...(seccion.rutasRelacionadas ?? [])].some(
                (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
              )
              return (
                <Link
                  key={seccion.titulo}
                  href={seccion.href}
                  aria-current={activo ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-full px-3 py-2 font-sans text-sm transition-colors ${
                    activo
                      ? 'bg-tinta text-crema font-medium'
                      : 'text-tinta/80 hover:bg-gris-calido/60 hover:text-tinta'
                  }`}
                >
                  {seccion.titulo}
                </Link>
              )
            })}
          </nav>
          {/* En teléfono la nav scrollea en horizontal y las dos últimas secciones quedan
              fuera de pantalla sin ninguna señal de que existen. El desvanecido sobre el
              borde derecho es esa señal. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-crema to-transparent lg:hidden"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="bg-marca text-crema px-5 sm:px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap shadow-sm shadow-marca/25 transition-colors hover:bg-tinta"
          >
            Ingresar
          </Link>
        </div>
      </div>
    </header>
  )
}
