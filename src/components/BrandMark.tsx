// Isotipo real de Elias Pacione: el monograma "///P" del Concepto 1 ("La
// Escucha" — las iniciales EP integradas en la forma de una taza), extraído
// pixel a pixel de PROPUESTA ELIAS.pdf. El PDF trae el mark solo rasterizado,
// así que se recortó desde la imagen nativa embebida (sin reescalados
// intermedios), se le quitó el fondo crema y se descartaron las sombras
// sueltas por componentes conexas. Es el logo original, no una recreación.
//
// Se pinta con `mask-image` en vez de un <img>: la silueta es exacta pero el
// color sale de `currentColor`, así que el mismo asset sirve sobre crema y
// sobre fondo oscuro sin necesitar dos versiones.
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        backgroundColor: 'currentColor',
        WebkitMaskImage: 'url(/brand/mark.png)',
        maskImage: 'url(/brand/mark.png)',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  )
}
