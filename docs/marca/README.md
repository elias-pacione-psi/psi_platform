# Marca personal — Elias Pacione

Implementado a partir de `PROPUESTA ELIAS.pdf` (brief de 26 páginas, 3 conceptos
alternativos). Se aplicó el **Concepto 1 · "La Escucha"**: las iniciales EP
integradas en la forma de una taza, como metáfora de la conversación.

> Antes se había implementado el Concepto 3 ("El Ser Integral", monograma
> orgánico con espiral). Quedó descartado — no queda nada de él en el código.

## El isotipo

`public/brand/mark.png` es el logo **original del PDF**, no una recreación. El
brief trae el mark únicamente rasterizado (no hay vector detrás: la página del
brandbook es una sola imagen de 1536×1024). Se extrajo así:

1. `pdftocairo -svg` de la página 14 → el `<image>` embebido en base64, que es
   el bitmap nativo sin reescalar.
2. Del SVG se leyó la matriz de transformación del PDF
   (`matrix(0.54744, 0, 0, 0.54744, 0.456427, 33.974996)`) para mapear puntos de
   página a píxeles y recortar exactamente sobre el original.
3. Bounding box del mark por umbral de luminancia → `(154,124)–(414,292)`.
4. Fondo crema removido por luminancia (alpha suave en el borde) y color
   normalizado a la tinta plana de marca.
5. Análisis de componentes conexas para descartar las sombras de hoja sueltas
   que caían dentro del recorte — se conservan solo las 3 formas del mark.

[`BrandMark.tsx`](../../src/components/BrandMark.tsx) lo pinta con
`mask-image` + `background-color: currentColor`: la silueta es el pixel exacto
del PDF pero el color lo hereda del contexto, así que el mismo asset sirve sobre
crema y sobre fondo oscuro sin mantener dos versiones.

El isotipo es **apaisado (~1.52:1)** — va en cajas anchas, nunca en un círculo.

## Paleta

Del brief: sage `#A8B7A0`, sage hondo `#8FA395`, crema `#F5F1EA`, gris cálido
`#D8D5CF`, carbón verdoso `#4A4F4C`.

| Token | Claro | Oscuro | Rol |
|---|---|---|---|
| `--crema` | `#F5F1EA` | `#1B211F` | Fondo |
| `--tinta` | `#4A4F4C` | `#ECE9E2` | Texto, encabezados, logo |
| `--marca` | `#54685B` | `#8FA395` | Acción: botones, links, íconos |
| `--sage` | `#A8B7A0` | `#8FA395` | Superficie: bloques, badges |
| `--gris-calido` | `#D8D5CF` | `#6C716C` | Neutro de apoyo |
| `--noche` / `--nieve` | `#333D3A` / `#F5F1EA` | (fijos) | Superficies siempre oscuras |

**Por qué `--marca` no es un sage del brief.** Los sages son claros a propósito
y funcionan como superficie, pero como color de acción no llegan al mínimo de
contraste: `#A8B7A0` da 1.88:1 sobre crema y 2.11:1 con texto blanco; `#8FA395`
da 2.38:1 y 2.68:1. `--marca` es ese mismo verde profundizado hasta pasar AA en
los dos roles a la vez — 5.32:1 sobre crema y 5.99:1 con texto encima. Los sages
originales viven intactos como `--sage` / `--sage-hondo`.

En **modo oscuro no hace falta el ajuste**: sobre el fondo `#1B211F` el sage real
del brief (`#8FA395`) da 6.1:1, así que ahí la marca usa su verde tal cual.

Los botones de marca usan `text-crema` y no `text-white`, porque `--crema` gira
con el tema: queda crema sobre verde oscuro en claro, y oscuro sobre sage claro
en oscuro. Con `text-white` el modo oscuro quedaba ilegible.

## Tipografía

Ambas del brief y disponibles en Google Fonts:

- **Poppins** — sistema completo (`--font-sans`, `--font-heading`).
- **Lora** — reservada al claim y a los textos de respiro (`--font-serif`),
  igual que en el logo: "Elias Pacione" en Poppins y "Psicología con sentido."
  en serif debajo.

## Fondo

`public/brand/leaf-shadow.png` es la sombra de hojas real del mockup, extraída
de la franja de la página que está por encima del logo (y = 0…124, donde no hay
nada más) y convertida a alpha para poder tintarla sobre cualquier fondo. Se usa
en el hero de la landing y, muy tenue, en el login. Va con una máscara radial
porque sin ella el PNG corta en seco y se ve el rectángulo.

## Grafía del nombre

La correcta es **"Elias Pacione"**: sin tilde y con una sola `c`, confirmado por
el titular. El brandbook del PDF lo rotula "Elias Paccione" (doble `c`), pero es
un error de la pieza de diseño — el apellido real coincide con el que firma
`proyecto formacion psi pastores.pdf` y con `lic.pacioneelias@gmail.com`.

Si en algún momento se reexporta el logo o alguna aplicación desde el PDF
original, hay que corregir el wordmark: el isotipo `///P` no está afectado.
