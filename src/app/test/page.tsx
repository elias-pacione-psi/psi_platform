import Link from 'next/link'
import { BookOpen, GraduationCap, MessagesSquare, HeartHandshake, ArrowRight } from 'lucide-react'

const PAGINAS = [
  {
    href: '/test/cursos',
    titulo: 'Cursos',
    subtitulo: 'Curso asincrónico',
    icono: BookOpen,
  },
  {
    href: '/test/formaciones',
    titulo: 'Formaciones',
    subtitulo: 'Con clases en vivo',
    icono: GraduationCap,
  },
  {
    href: '/test/supervisiones',
    titulo: 'Supervisiones',
    subtitulo: 'Para colegas y estudiantes avanzados',
    icono: MessagesSquare,
  },
  {
    href: '/test/terapia-individual',
    titulo: 'Terapia individual',
    subtitulo: 'Acompañamiento personal',
    icono: HeartHandshake,
  },
]

// Índice de las 4 páginas de prueba, una por botón de la nav de la landing
// (page.tsx / SECCIONES_NAV). Sirve para revisar el borrador de texto e
// imágenes de cada una sin tener que recordar las 4 rutas de memoria.
export default function TestIndexPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <div className="mx-auto w-full max-w-5xl px-6 pt-16 pb-20">
        <Link href="/" className="text-sm text-marca hover:text-tinta transition-colors">
          ← Volver al inicio
        </Link>

        <h1 className="mt-8 text-tinta text-3xl md:text-4xl font-heading font-semibold mb-4 leading-[1.15] tracking-tight">
          Páginas de prueba
        </h1>
        <p className="font-serif text-tinta/75 text-lg leading-relaxed mb-12 max-w-2xl">
          Un borrador de explicación e imágenes de muestra para cada uno de los cuatro
          botones de la nav principal (Cursos, Formaciones, Supervisiones, Terapia
          individual). Ninguna está enlazada desde el sitio todavía — son para revisar
          contenido antes de decidir si se integran.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PAGINAS.map(({ href, titulo, subtitulo, icono: Icono }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 bg-card rounded-2xl border border-border p-6 transition-colors hover:border-marca"
            >
              <Icono className="w-8 h-8 text-marca shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <h2 className="font-heading font-semibold text-tinta text-lg tracking-tight">{titulo}</h2>
                <p className="text-sm text-muted-foreground">{subtitulo}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-marca" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
