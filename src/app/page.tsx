import { Suspense } from 'react'
import Link from 'next/link'
import { FolderHeart, Calendar, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BrandMark } from '@/components/BrandMark'
import { LandingClient } from './LandingClient'

// Los cuatro conceptos que el brief define como la esencia de la marca.
const conceptos = [
  { titulo: 'Pausa', texto: 'Un momento para detenerse, bajar el ritmo y conectar con uno mismo.' },
  { titulo: 'Escucha', texto: 'La conversación como herramienta de encuentro y comprensión.' },
  { titulo: 'Contención', texto: 'Un espacio seguro donde lo que te pasa puede ser acompañado.' },
  { titulo: 'Cercanía', texto: 'Una identidad cálida y humana que prioriza el vínculo y la confianza.' },
]

// Navegación de la landing, en el orden en que van de izquierda a derecha. Ebooks es
// el único producto con compra directa — tiene su propia vidriera. Los otros cuatro
// bajan al formulario de Consultas con el interés ya elegido en el desplegable (mismos
// valores que el check `solicitudes_interes_valido` de la migración
// 2026-08-04-ebooks-y-desplegable-interes.sql), porque no se venden online: los sigue
// coordinando Elias a mano — ver docs/plan-modelo-comercial.md.
const SECCIONES_NAV = [
  { titulo: 'Ebooks', href: '/ebooks' },
  { titulo: 'Cursos', href: '/?interes=curso#contacto' },
  { titulo: 'Formaciones', href: '/?interes=formacion#contacto' },
  { titulo: 'Supervisiones', href: '/?interes=supervision#contacto' },
  { titulo: 'Terapia individual', href: '/?interes=terapia_individual#contacto' },
]

const prestaciones = [
  { icono: FolderHeart, titulo: 'Material a tu medida', texto: 'Solo ves el contenido que Elias preparó para vos, organizado en programas y una biblioteca de apoyo.' },
  { icono: Calendar, titulo: 'Tus encuentros', texto: 'La agenda de tus próximos encuentros, presenciales o virtuales, con acceso directo a la videollamada.' },
  // "Acceso únicamente por invitación" quedó desactualizado: los ebooks se compran
  // directo, sin invitación. Lo que sigue siendo cierto —y lo que importa acá— es que
  // nada de lo que un alumno hace en la plataforma se publica ni se comparte.
  { icono: ShieldCheck, titulo: 'Privado', texto: 'Tu actividad en la plataforma no se publica ni se comparte con nadie.' },
]

// Landing sobria
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-crema font-sans flex flex-col">
      <header className="w-full sticky top-0 z-50 bg-crema/85 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-3">
            <BrandMark className="w-11 h-7 shrink-0 text-tinta" />
            <span className="flex flex-col leading-tight">
              <span className="font-heading font-semibold text-lg tracking-tight text-tinta">Elias Pacione</span>
              {/* La bajada se cae en pantallas chicas: con la nav ya ocupando una fila
                  propia, mantenerla partía la cabecera en tres y se comía media pantalla. */}
              <span className="hidden sm:block font-serif text-xs text-muted-foreground -mt-0.5">Psicología con sentido.</span>
            </span>
          </div>

          {/* En lg+ va entre la marca y el toggle, alineada a la derecha para que el
              último rótulo quede pegado al botón de tema. Abajo de lg pasa a una fila
              propia con scroll horizontal: cinco secciones no entran al lado del
              logo en un teléfono, y esconderlas las volvería inalcanzables. */}
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

      {/* HERO — lienzo liso. Antes tenía la sombra de hojas del brandbook
          (/brand/leaf-shadow.png) difuminada arriba a la izquierda; se sacó a
          pedido. El fondo lo pone `bg-crema` del <main>, que ya gira con el
          tema, así que el equivalente oscuro sale solo. */}
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto text-center px-6 pt-28 pb-24">
          <BrandMark className="w-24 h-16 mx-auto mb-10 text-tinta" />
          <h1 className="text-tinta text-4xl md:text-5xl font-heading font-semibold mb-6 leading-[1.15] tracking-tight">
            No estás solo en tu proceso
          </h1>
          <p className="font-serif text-tinta/75 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
            Un espacio profesional, humano y seguro donde tu mente, tus emociones y tu
            espiritualidad pueden ser escuchadas y comprendidas.
          </p>
          <Link
            href="#contacto"
            className="inline-block bg-tinta text-crema px-10 py-4 rounded-full font-medium text-base transition-colors hover:bg-marca"
          >
            Comenzar proceso
          </Link>
        </div>
      </section>

      {/* CONCEPTOS — pausa, escucha, contención, cercanía */}
      {/* Fondo con el azul pálido del board (--gris-calido) y no con --sage: el
          sage es el único verde de una paleta por lo demás azul, y al 25% sobre el
          lienzo la mezcla daba un oliva que no pertenecía a ninguna de las dos
          familias. */}
      <section className="bg-gris-calido/50 dark:bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {conceptos.map(({ titulo, texto }) => (
              <div key={titulo}>
                <h2 className="font-heading font-semibold text-tinta text-base tracking-[0.14em] uppercase mb-3">
                  {titulo}
                </h2>
                <p className="font-serif text-sm text-tinta/70 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ VAS A ENCONTRAR ACÁ DENTRO */}
      <section>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prestaciones.map(({ icono: Icono, titulo, texto }) => (
              <div key={titulo} className="bg-card rounded-2xl border border-border p-7">
                <Icono className="w-7 h-7 text-marca mb-5" strokeWidth={1.5} />
                <h3 className="font-heading font-semibold text-tinta text-lg mb-2 tracking-tight">{titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de Contacto */}
      {/* Suspense: LandingClient usa useSearchParams() (para preseleccionar el interés
          que trajo el botón de nav), y Next exige envolver eso en un límite de Suspense
          para poder generar la página como estática. Sin fallback visible — el formulario
          está debajo del pliegue y la hidratación es casi instantánea. */}
      <Suspense>
        <LandingClient />
      </Suspense>

      <footer className="bg-noche text-nieve/70 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <BrandMark className="w-9 h-6 shrink-0 text-nieve/80" />
            <p className="font-serif text-sm text-nieve/70 leading-snug">
              Acompañamiento psicológico para
              <br />
              una vida con más equilibrio y propósito.
            </p>
          </div>
          <div className="text-sm space-y-2 md:text-right">
            <p>&copy; {new Date().getFullYear()} Elias Pacione. Plataforma privada de material para alumnos.</p>
            <p>
              <Link href="/privacidad" className="underline hover:text-nieve transition-colors">
                Política de privacidad
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
