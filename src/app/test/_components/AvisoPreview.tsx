import Link from 'next/link'

// Franja fija arriba de cada página de /test: deja explícito que es contenido en
// revisión, no una ruta real del sitio. Nada de esto está enlazado desde el nav
// de page.tsx todavía — los botones de la landing siguen yendo directo al
// formulario de Consultas (ver docs/plan-modelo-comercial.md).
export function AvisoPreview({ servicioActual }: { servicioActual: string }) {
  return (
    <div className="bg-noche text-nieve/90">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-sm">
        <p>
          <span className="font-semibold">Vista previa de contenido —</span> borrador de{' '}
          {servicioActual} para revisar texto e imágenes, no está enlazada desde el sitio.
        </p>
        <Link href="/test" className="whitespace-nowrap underline hover:text-nieve">
          Ver las otras páginas de prueba
        </Link>
      </div>
    </div>
  )
}
