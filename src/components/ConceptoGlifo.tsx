// Los cuatro conceptos de la marca —pausa, escucha, contención, cercanía— como dibujos
// chicos, en el mismo idioma que las ilustraciones de las páginas de servicio: trazo de
// tinta redondeado, rellenos en sage, personas sin cara y la taza del isotipo.
//
// Van como SVG en línea y no en el bucket como las ilustraciones grandes: son decorativos,
// pesan casi nada y heredan el tema solos — `currentColor` y los tokens de la paleta
// (`fill-sage`, `fill-card`) giran con la clase `dark`, así que no hace falta un par
// claro/oscuro. Sin texto adentro, por el mismo motivo que las otras.
export type ConceptoGlifoNombre = 'pausa' | 'escucha' | 'contencion' | 'cercania'

const DIBUJOS: Record<ConceptoGlifoNombre, React.ReactNode> = {
  // Una hoja quieta sobre el agua: las ondas se abren y se apagan alrededor.
  pausa: (
    <>
      <ellipse cx="60" cy="62" rx="54" ry="18" strokeOpacity="0.2" />
      <ellipse cx="60" cy="62" rx="38" ry="12.5" strokeOpacity="0.4" />
      <ellipse cx="60" cy="62" rx="22" ry="7.5" strokeOpacity="0.75" />
      <path d="M 34 54 C 46 33 74 31 90 46 C 76 67 48 71 34 54 Z" className="fill-sage" />
      <path d="M 38 53 C 52 47 72 45 86 47" />
    </>
  ),
  // La taza del isotipo, con el vapor subiendo, y la voz que llega a su lado.
  escucha: (
    <>
      <path d="M 28 78 L 80 78" />
      <path d="M 34 44 L 74 44 L 68 74 L 40 74 Z" className="fill-sage" />
      <path d="M 74 50 q 14 4 0 18" />
      <path d="M 46 36 q -6 -9 2 -16" />
      <path d="M 62 36 q -6 -9 2 -16" />
      <path d="M 94 42 q 7 8 0 16" strokeOpacity="0.6" />
      <path d="M 103 34 q 12 16 0 32" strokeOpacity="0.35" />
    </>
  ),
  // Un cuenco que sostiene lo que recién brota, y dos arcos que lo rodean.
  contencion: (
    <>
      <path d="M 18 40 Q 8 62 24 82" strokeOpacity="0.45" />
      <path d="M 102 40 Q 112 62 96 82" strokeOpacity="0.45" />
      <path d="M 60 54 L 60 30" />
      <path d="M 60 42 C 48 42 42 34 42 25 C 53 25 60 31 60 42 Z" className="fill-card" />
      <path d="M 60 36 C 70 36 76 29 77 21 C 67 21 61 27 60 36 Z" className="fill-card" />
      <path d="M 28 54 Q 28 80 60 80 Q 92 80 92 54 Z" className="fill-sage" />
    </>
  ),
  // Dos personas lo bastante cerca como para tocarse los hombros, sobre un mismo halo.
  cercania: (
    <>
      <circle cx="60" cy="52" r="36" className="fill-sage" fillOpacity="0.28" stroke="none" />
      <circle cx="43" cy="32" r="11" className="fill-sage" />
      <path d="M 22 78 Q 22 52 43 52 Q 64 52 64 78 Z" className="fill-sage" />
      <circle cx="77" cy="32" r="11" className="fill-card" />
      <path d="M 56 78 Q 56 52 77 52 Q 98 52 98 78 Z" className="fill-card" />
    </>
  ),
}

// Cuánto hay que correr cada dibujo hacia la izquierda para que su borde quede pegado al del
// texto de abajo (cada uno tiene un margen interno distinto dentro del lienzo de 120).
const CORRIMIENTO_X: Record<ConceptoGlifoNombre, number> = { pausa: 2, escucha: 22, contencion: 8, cercania: 16 }

export function ConceptoGlifo({ nombre, className }: { nombre: ConceptoGlifoNombre; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform={`translate(${-CORRIMIENTO_X[nombre]} 0)`}>{DIBUJOS[nombre]}</g>
    </svg>
  )
}
