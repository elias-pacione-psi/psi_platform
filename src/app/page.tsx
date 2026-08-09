import { Suspense } from 'react'
import Link from 'next/link'
import { FolderHeart, Calendar, ShieldCheck, Video, Users, MapPin } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { SiteHeader } from '@/components/SiteHeader'
import { LandingClient } from './LandingClient'

// Los cuatro conceptos que el brief define como la esencia de la marca.
const conceptos = [
  { titulo: 'Pausa', texto: 'Un momento para detenerse, bajar el ritmo y conectar con uno mismo.' },
  { titulo: 'Escucha', texto: 'La conversación como herramienta de encuentro y comprensión.' },
  { titulo: 'Contención', texto: 'Un espacio seguro donde lo que te pasa puede ser acompañado.' },
  { titulo: 'Cercanía', texto: 'Una identidad cálida y humana que prioriza el vínculo y la confianza.' },
]

// Perfil profesional — tomado del listado público de Elias en Psychology Today
// (colegiatura, especialidades y enfoques declarados ahí).
const especialidades = [
  'Ansiedad',
  'Depresión',
  'Estrés',
  'Autoestima',
  'Conflictos relacionales',
  'Trauma y estrés postraumático',
  'TOC',
  'Trastorno límite de la personalidad',
]

const datosRapidos = [
  { icono: Video, titulo: 'Modalidad', texto: 'Presencial y virtual' },
  { icono: Users, titulo: 'Atiende a', texto: 'Adolescentes, adultos y parejas' },
  { icono: MapPin, titulo: 'Dónde', texto: 'Wilde y Quilmes, Buenos Aires' },
]

const enfoques = [
  'Terapia cognitivo-conductual',
  'Terapia racional emotiva conductual',
  'Programación neurolingüística',
  'Mindfulness',
  'Terapia sistémica familiar',
  'Terapia cristiana',
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
      <SiteHeader />

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

      {/* SOBRE ELÍAS — credibilidad profesional antes de mostrar la plataforma.
          Contenido tomado del perfil público de Psychology Today. */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-12 items-start">
            <div>
              <h2 className="font-heading font-semibold text-tinta text-3xl tracking-tight mb-4">
                Sobre Elías
              </h2>
              <p className="font-serif text-tinta/75 text-base leading-relaxed mb-4">
                Licenciado en Psicología, con más de 12 años de trayectoria acompañando
                procesos de adolescentes, adultos y parejas. Su formación es ecléctica:
                integra herramientas de distintos enfoques según lo que cada proceso
                necesita, en modalidad presencial y virtual.
              </p>
              <p className="font-serif text-tinta/75 text-base leading-relaxed mb-5">
                Atiende presencialmente en Wilde y Quilmes (Buenos Aires), además de
                sesiones virtuales para quienes están en otra ciudad o prefieren esa
                modalidad.
              </p>
              <p className="font-serif italic text-tinta/60 text-sm leading-relaxed border-l-2 border-marca pl-4 mb-5">
                &ldquo;No son los hechos o problemas lo que nos afectan, sino lo que
                pensamos acerca de ellos.&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Colegio de Psicólogos de la Provincia de Buenos Aires · Distrito XII (Quilmes)
              </p>
            </div>

            <div className="space-y-7">
              <div>
                <h3 className="font-heading font-semibold text-tinta text-sm uppercase tracking-[0.14em] mb-3">
                  Áreas de trabajo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {especialidades.map((item) => (
                    <span
                      key={item}
                      className="inline-block bg-gris-calido/60 dark:bg-card text-tinta/80 text-xs px-3 py-1.5 rounded-full border border-border"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold text-tinta text-sm uppercase tracking-[0.14em] mb-3">
                  Enfoques terapéuticos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {enfoques.map((item) => (
                    <span
                      key={item}
                      className="inline-block bg-gris-calido/60 dark:bg-card text-tinta/80 text-xs px-3 py-1.5 rounded-full border border-border"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {datosRapidos.map(({ icono: Icono, titulo, texto }) => (
                  <div
                    key={titulo}
                    className="flex items-start gap-3 bg-gris-calido/40 dark:bg-card border border-border rounded-xl p-3.5"
                  >
                    <Icono className="w-4 h-4 text-marca shrink-0 mt-0.5" strokeWidth={1.75} />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{titulo}</p>
                      <p className="font-serif text-sm text-tinta/80 leading-snug">{texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
            <p>&copy; {new Date().getFullYear()} Elias Pacione.</p>
            {/* El "Botón de Arrepentimiento" tiene que estar visible en la home
                (Resolución 424/2020) para quien compra un ebook — no puede ir escondido
                dentro de otra página. Va acá junto a los otros dos links legales. */}
            <p className="flex flex-wrap gap-x-4 gap-y-1 md:justify-end">
              <Link href="/privacidad" className="underline hover:text-nieve transition-colors">
                Política de privacidad
              </Link>
              <Link href="/terminos" className="underline hover:text-nieve transition-colors">
                Términos y condiciones
              </Link>
              <Link href="/arrepentimiento" className="underline hover:text-nieve transition-colors">
                Botón de arrepentimiento
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
