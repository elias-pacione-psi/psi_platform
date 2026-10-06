# Operador Socioterapéutico — diapositivas y alta en la plataforma

Convierte el libro **"Programa de Formación: Operador Socioterapéutico en Adicciones"** (PDF de Elias,
en `Biblioteca R2/Libros/`) en un programa de la plataforma del tipo **Material de formación**
(`programas.tipo = 'formacion'`): **cada capítulo del libro es un módulo y su contenido, una lección** —
una presentación en formato diapositivas (16:9) para que el psicólogo explique en vivo.

| Capítulo del libro (índice) | Módulo | Diapositivas |
|---|---|---|
| 1. Presentación del programa | Presentación del programa | 11 |
| 2. Encuadre ético | Encuadre ético del programa | 6 |
| 3–10. Módulos 1 a 8 | Módulo 1 … Módulo 8 | 10–15 c/u |
| 11. Cierre, bibliografía e índice de herramientas | Cierre del programa… | 6 |

Total: **11 módulos, 11 lecciones, 124 diapositivas**.

## Qué lleva cada presentación

Pensadas para **proyectar**, no para leer: una idea por diapositiva, cuerpo de letra de 14 pt o más
(`generar.js` imprime un reporte de legibilidad con lo que quede por debajo) y, en cada módulo:

- **Portada, objetivos y agenda del encuentro** (barra proporcional de los 120 minutos y sus bloques).
- **Mapas conceptuales** con frases de enlace entre los conceptos (`mapa` y `hub`), más esquemas
  propios del contenido: estadios del cambio, Ciclo Invisible de la Recaída™ (`ciclo`), curva del
  craving (`curva`), niveles de atención (`escalera`), comparaciones sí/no, tablas.
- **Claves del módulo** al cierre (la diapositiva con la llavecita) y **la herramienta práctica** del
  módulo como hoja imprimible.
- En el `.pptx`, **notas del orador**: el desarrollo completo que el autor escribió sobre cada punto,
  textual (sale de `contenido/libro.json`). La diapositiva dice poco; la nota, todo.

## Archivos

| | |
|---|---|
| `contenido/NN-*.js` | Un archivo por capítulo: los textos de cada diapositiva (datos, no maquetación). Es lo que se edita para cambiar contenido. |
| `contenido/libro.json` | El libro por secciones (`1.2`, `H3`, `E1`…), para las notas del orador. Lo genera `extraer-libro.js`; no hace falta el PDF para regenerar. |
| `lib/slides.js` | Los 17 layouts de diapositiva sobre `pptxgenjs`, con la marca del sitio (`../curso-pastoral/brand.js`). |
| `lib/medir.js` | Mide cada texto con las métricas reales de Poppins/Lora para que nada se desborde. |
| `generar.js` | Arma `out/pptx/*.pptx` y, con LibreOffice, `out/pdf/*.pdf`. |
| `deploy.js` | Sube a R2 y crea/actualiza programa, módulos y lecciones. Idempotente (ids fijos). |
| `extraer-libro.js` | PDF del libro → `contenido/libro.json` (necesita `pdftotext`). |

`out/` no se versiona: se regenera.

## Uso

Necesita Node, LibreOffice (`soffice`), las fuentes Poppins y Lora instaladas y las variables de
`.env.local` (R2 y service-role). Las dependencias son las mismas de `scripts/curso-pastoral`: con
`npm install` acá, o `NODE_PATH=../curso-pastoral/node_modules` si ya están instaladas allá.

```bash
cd scripts/operador-socioterapeutico
node generar.js                 # todo; --solo=3 un capítulo; --sin-pdf para iterar rápido
node deploy.js --dry-run        # qué haría, sin tocar nada
node deploy.js                  # sube a R2 y da de alta en la base
```

Para retocar una presentación: editar el capítulo en `contenido/`, `node generar.js --solo=<n>`, mirar el
PDF y volver a `node deploy.js`. Para cambiar el libro de origen: `node extraer-libro.js "<ruta al PDF>"`.

## Dónde queda cada cosa

- **R2**: `Formaciones/Operador Socioterapeutico/diapositivas/*.pdf` (las lecciones) y
  `…/diapositivas editables/*.pptx` (para presentar o editar en PowerPoint/Keynote, con las notas).
  La portada, en `Biblioteca R2/portadas/programas/` (ver `docs/portadas/`).
- **Base**: programa `33333333-3333-3333-3333-333333333333`; módulos `a3333333-…-0000000000NN`;
  lecciones `b3333333-…-0000000000NN` (NN = 00 a 10). Cada lección es `drive_pdf` / `pdf` / `r2`, igual
  que las de la formación pastoral.
- **Visibilidad**: el programa se crea **oculto** (`publicado_en_home = false`, como todo programa
  nuevo). Se publica en `/cursos` desde el panel (Programas → "Publicar en Home"). Si ya existe,
  `deploy.js` no toca esa marca ni la portada.

## Observaciones sobre el libro (para revisar con el autor)

Las diapositivas reproducen el libro tal cual; estos puntos no se corrigieron por no ser decisión mía:

- **Cifra desactualizada**: 3.3 dice que los trastornos por consumo afectan a "más de 39 millones de
  personas". El Informe Mundial sobre las Drogas 2024 (UNODC) —el mismo que da los 292 millones, el
  +20 % y el "1 de cada 7 hombres / 1 de cada 18 mujeres" que cita el libro— estima **64 millones**
  (39 millones era la edición anterior). "Más de 39 millones" sigue siendo cierto, pero no es el dato
  vigente. Se edita en `contenido/02-modulo-1.js` (diapositiva "Un problema que atraviesa a toda la sociedad").
- **Referencia cruzada rota**: 3.5 dice que la curva del craving "es la base de la herramienta 5", pero
  la herramienta 5 es "El espejo de la comunidad" (la curva no tiene herramienta propia). La diapositiva
  omite esa referencia.
- **Bloques de 40 minutos**: la metodología habla de "bloques de 40 minutos", pero la estructura de cada
  módulo reparte los 120 minutos en bloques de 5 a 30. Cada diapositiva muestra lo que dice el libro en
  su lugar, sin conciliarlo.
