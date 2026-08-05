import Link from 'next/link'
import { BrandMark } from '@/components/BrandMark'
import { ThemeToggle } from '@/components/ThemeToggle'

// Mismo header en todas las páginas públicas (landing, ebooks, cursos, formaciones,
// supervisiones, terapia individual). Antes cada una tenía su propia versión
// achicada (ebooks sin lema ni nav; las de servicio solo con un link de texto) y se
// desincronizaban. Con un solo componente compartido hay un único lugar que mantener.
const SECCIONES_NAV = [
  { titulo: 'ebooks', href: '/ebooks' },
  { titulo: 'Cursos', href: '/cursos' },
  { titulo: 'Formaciones', href: '/formaciones' },
  { titulo: 'Supervisiones', href: '/supervisiones' },
  { titulo: 'Terapia individual', href: '/terapia-individual' },
]

export function SiteHeader() {
  return (
    <header className="w-full sticky top-0 z-50 bg-crema/85 backdrop-blur-sm border-b border-border px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-3">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="w-11 h-7 shrink-0 text-tinta" />
          <span className="flex flex-col leading-tight">
            <span className="font-heading font-semibold text-lg tracking-tight text-tinta">Elias Pacione</span>
            <span className="hidden sm:block font-serif text-xs text-muted-foreground -mt-0.5">Psicología con sentido.</span>
          </span>
        </Link>

        <nav className="order-last w-full flex items-center gap-1 overflow-x-auto lg:order-none lg:w-auto lg:flex-1 lg:justify-end lg:overflow-visible">
          {SECCIONES_NAV.map((seccion) => (
            <Link
              key={seccion.titulo}
              href={seccion.href}
              className="whitespace-nowrap rounded-full px-3 py-2 font-sans text-sm text-tinta/80 transition-colors hover:bg-gris-calido/60 hover:text-tinta"
            >
              {seccion.titulo}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="bg-marca text-crema px-4 sm:px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-colors hover:bg-tinta"
          >
            Ingresar
          </Link>
        </div>
      </div>
    </header>
  )
}
