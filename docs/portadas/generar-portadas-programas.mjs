// Genera las portadas de los PROGRAMAS (cursos asincrónicos y formaciones) con el mismo
// sistema de diseño que las portadas de ebooks — ver docs/portadas/README.md.
//
//   node docs/portadas/generar-portadas-programas.mjs            → PNG en docs/portadas/programas/
//   node docs/portadas/generar-portadas-programas.mjs --subir    → además los sube a R2
//   node docs/portadas/generar-portadas-programas.mjs --asignar  → además setea programas.portada_key
//   --solo=<slug>                                                → itera un solo diseño
//
// ESTE ARCHIVO ES LA FUENTE: para retocar una portada se edita la escena de acá y se vuelve a
// correr. Mismo criterio que generar-ilustraciones.mjs (que arma las ilustraciones de las
// páginas públicas): el dibujo vive como código, no como un PNG que nadie puede editar.
//
// Qué se mantiene idéntico a las portadas de libros (707×942, 3:4):
//   banda #2F3E46 de 134 px con "Elias Pacione" / "Psicología con sentido." / isotipo,
//   fondo crema #F1F0EB, panel redondeado con degradé suave, el círculo "pausa" con su brillo
//   sage, las tres barras del isotipo abajo a la derecha, título Poppins 700 y subtítulo Lora
//   italic alineados a la izquierda (x54).
// Qué cambia: la ilustración del panel (una por programa) y la altura del panel (568 px en vez
// de los 620 de Vuelvo / Estrés Pastoral), porque casi todos los títulos de programa ocupan dos
// líneas y el texto necesita ese aire.
//
// Colores: tokens ACTUALES de src/app/globals.css (los mismos que miden Vuelvo y Estrés
// Pastoral). No usar la paleta verde vieja del README de portadas — esa es de Sin Culpa.
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import dotenv from 'dotenv'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: path.join(RAIZ, '.env.local'), quiet: true })

const SALIDA = path.join(RAIZ, 'docs/portadas/programas')
const CARPETA_R2 = 'Biblioteca R2/portadas/programas/'
const ANCHO = 707
const ALTO = 942
const PANEL = { x: 44, y: 158, w: 620, h: 568, radio: 38 }

// ---------------------------------------------------------------------------
// Paleta (src/app/globals.css) y trazos (medidos sobre Estrés Pastoral: ~14 px)
// ---------------------------------------------------------------------------
const C = {
  tinta: '#2F3E46',
  marca: '#4E6478',
  sage: '#A8B79F',
  hondo: '#7F95A6', // --sage-hondo
  gris: '#D6DEE5', // --gris-calido
  crema: '#F1F0EB',
  hueso: '#F7F6F3',
}
const SW = 14 // trazo principal
const SW2 = 10 // trazo secundario
const REMATE = 'stroke-linecap="round" stroke-linejoin="round"'
const trazo = (w = SW, extra = '') => `fill="none" stroke="${C.tinta}" stroke-width="${w}" ${REMATE} ${extra}`
const solido = (fill, w = SW, extra = '') => `fill="${fill}" stroke="${C.tinta}" stroke-width="${w}" ${REMATE} ${extra}`

// ---------------------------------------------------------------------------
// Piezas reutilizables (mismo vocabulario que generar-ilustraciones.mjs, a escala de portada)
// ---------------------------------------------------------------------------
let _uid = 0

// El círculo "pausa" con su brillo sage — firma de las portadas Vuelvo / Estrés Pastoral.
function pausa(cx, cy, r = 48) {
  const id = `brillo${++_uid}`
  return `<defs><radialGradient id="${id}"><stop offset="${(r / 190).toFixed(3)}" stop-color="${C.sage}" stop-opacity=".45"/><stop offset="1" stop-color="${C.sage}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${cx}" cy="${cy}" r="190" fill="url(#${id})"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.sage}" opacity=".8"/>`
}

// Las tres barras del isotipo, muy bajas de opacidad (abajo a la derecha del panel).
function barras(x = 482, y = 442, alto = 82) {
  return `<g opacity=".12">${[0, 1, 2]
    .map((i) => `<line x1="${x + i * 44 + 26}" y1="${y}" x2="${x + i * 44}" y2="${y + alto}" stroke="${C.tinta}" stroke-width="20" stroke-linecap="round"/>`)
    .join('')}</g>`
}

// Persona: cabeza y hombros, sin cara (son personas cualquiera, no personajes).
// (x, y) = centro de la cabeza; la base de los hombros queda en y + 122·s.
function persona(x, y, { s = 1, color = C.sage, w = SW } = {}) {
  const r = 34 * s
  const hombro = y + 50 * s
  const base = y + 122 * s
  const mitad = 52 * s
  return `<g>
    <path d="M ${x - mitad} ${base} Q ${x - mitad} ${hombro} ${x} ${hombro} Q ${x + mitad} ${hombro} ${x + mitad} ${base} Z" ${solido(color, w)}/>
    <circle cx="${x}" cy="${y}" r="${r}" ${solido(color, w)}/>
  </g>`
}

// Globo de diálogo con la cola dentro del mismo contorno (si la cola es un triángulo aparte,
// la línea del borde queda cruzando el globo).
function globo(x, y, w, h, { colaX, puntaX = colaX, colaY = y + h + 50, color, opacidad = 0.3, r = 34, ancho = 12 }) {
  const d = [
    `M ${x + r} ${y}`, `H ${x + w - r}`, `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`, `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${colaX + 24}`, `L ${puntaX} ${colaY}`, `L ${colaX - 24} ${y + h}`,
    `H ${x + r}`, `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`, `V ${y + r}`, `A ${r} ${r} 0 0 1 ${x + r} ${y}`, 'Z',
  ].join(' ')
  return `<path d="${d}" fill="${color}" fill-opacity="${opacidad}" stroke="${C.tinta}" stroke-width="${ancho}" ${REMATE}/>`
}

// Unión de formas con UN solo contorno exterior: se pintan todas en tinta con el trazo al doble
// y encima todas en su relleno sin trazo, así las líneas internas de cada forma desaparecen.
function silueta(formas, relleno) {
  const attrs = (f) =>
    f.tag === 'circle'
      ? `cx="${f.cx}" cy="${f.cy}" r="${f.r}"`
      : `x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${f.rx ?? 0}"`
  const contorno = formas
    .map((f) => `<${f.tag} ${attrs(f)} fill="${C.tinta}" stroke="${C.tinta}" stroke-width="${SW * 2}" ${REMATE}/>`)
    .join('')
  const interior = formas.map((f) => `<${f.tag} ${attrs(f)} fill="${f.relleno ?? relleno}"/>`).join('')
  return contorno + interior
}

const puntos = (d, o = 0.5) => `<path d="${d}" fill="none" stroke="${C.tinta}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 24" opacity="${o}"/>`

// ---------------------------------------------------------------------------
// Las siete escenas. Coordenadas del panel: 620 × 568. Los bordes redondeados comen ~40 px
// en las esquinas, así que nada importante va pegado a ellas.
// ---------------------------------------------------------------------------
const ESCENAS = {
  // Ansiedad y fobias — "paso a paso": la escalera de exposición, de lo más leve a lo más difícil.
  'ansiedad-y-fobias': () => {
    const base = 498
    const x0 = 172
    const ancho = 58
    const peldaños = 5
    // Un solo contorno: con cinco rectángulos sueltos la escalera se leía como un gráfico de barras.
    let d = `M ${x0} ${base} L ${x0} ${base - 56}`
    for (let i = 0; i < peldaños; i++) {
      const alto = 56 + i * 52
      d += ` L ${x0 + i * ancho} ${base - alto} L ${x0 + (i + 1) * ancho} ${base - alto}`
    }
    d += ` L ${x0 + peldaños * ancho} ${base} Z`
    return `
      ${pausa(478, 128, 46)}
      ${barras()}
      <path d="M 48 ${base + 6} L 468 ${base + 6}" stroke="${C.gris}" stroke-width="24" stroke-linecap="round" fill="none"/>
      <path d="${d}" ${solido(C.hondo)}/>
      ${persona(86, base - 122 * 1.15, { s: 1.15 })}
      ${puntos('M 96 304 C 184 262 256 214 326 178 S 420 140 434 134', 0.5)}`
  },

  // Herramientas cognitivas — del pensamiento distorsionado (garabato) al diálogo interno reescrito.
  'herramientas-cognitivas': () => `
    ${pausa(520, 100, 40)}
    ${globo(46, 56, 262, 150, { colaX: 126, colaY: 258, color: C.hondo, opacidad: 0.3 })}
    <path d="M 84 150 C 84 98 152 94 148 142 C 144 186 98 162 128 124 C 154 96 218 102 210 150 C 204 188 162 152 194 126 C 216 110 258 118 266 146" ${trazo(SW2)} opacity=".85"/>
    ${globo(300, 232, 274, 156, { colaX: 352, puntaX: 318, colaY: 434, color: C.sage, opacidad: 0.45 })}
    <circle cx="352" cy="296" r="26" ${solido(C.sage, SW2)}/>
    <path d="M 341 296 l 8 9 l 17 -19" ${trazo(SW2)}/>
    <line x1="398" y1="276" x2="540" y2="276" stroke="${C.tinta}" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/>
    <line x1="398" y1="305" x2="522" y2="305" stroke="${C.tinta}" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/>
    <line x1="332" y1="344" x2="500" y2="344" stroke="${C.tinta}" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/>
    ${persona(130, 330, { s: 1.3 })}
    ${puntos('M 296 188 C 318 204 330 214 340 226', 0.5)}
    ${barras()}`,

  // Regulación emocional — modular: el dial, y la ola que baja de amplitud hacia la calma.
  'regulacion-emocional': () => {
    const cx = 310
    const cy = 262
    const R = 150
    const pol = (r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)]
    const marcas = Array.from({ length: 15 }, (_, i) => {
      const deg = 135 + i * (270 / 14)
      const [x1, y1] = pol(112, deg)
      const [x2, y2] = pol(134, deg)
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.tinta}" stroke-width="10" stroke-linecap="round" opacity="${i <= 8 ? 1 : 0.28}"/>`
    }).join('')
    const [px, py] = pol(88, 135 + 8 * (270 / 14))
    return `
      ${pausa(124, 118, 44)}
      <circle cx="${cx}" cy="${cy}" r="${R}" ${solido(C.hueso)}/>
      ${marcas}
      <line x1="${cx}" y1="${cy}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" ${trazo(SW + 2)}/>
      <circle cx="${cx}" cy="${cy}" r="26" ${solido(C.sage)}/>
      <path d="M 48 504 C 70 440 100 440 124 504 S 178 556 200 504 S 244 466 266 504 S 306 526 326 504 S 362 490 382 504 S 414 510 436 504" fill="none" stroke="${C.hondo}" stroke-width="16" stroke-linecap="round"/>
      ${barras()}`
  },

  // Neuropsicología aplicada — el cerebro y las conexiones que se pueden volver a trazar.
  'neuropsicologia-aplicada': () => {
    const formas = [
      { tag: 'circle', cx: 212, cy: 262, r: 62 },
      { tag: 'circle', cx: 262, cy: 198, r: 70 },
      { tag: 'circle', cx: 338, cy: 182, r: 74 },
      { tag: 'circle', cx: 410, cy: 222, r: 66 },
      { tag: 'circle', cx: 438, cy: 292, r: 56 },
      { tag: 'circle', cx: 392, cy: 340, r: 62 },
      { tag: 'circle', cx: 306, cy: 344, r: 66 },
      { tag: 'circle', cx: 226, cy: 334, r: 54 },
      { tag: 'circle', cx: 320, cy: 268, r: 96 },
      { tag: 'rect', x: 330, y: 372, w: 44, h: 66, rx: 20 },
    ]
    return `
      ${pausa(500, 106, 40)}
      ${silueta(formas, C.sage)}
      <path d="M 312 120 C 296 172 332 196 314 244 S 322 304 344 350" ${trazo(SW2)}/>
      <path d="M 196 232 C 226 252 250 228 272 252" ${trazo(SW2)}/>
      <path d="M 366 214 C 392 232 416 216 432 244" ${trazo(SW2)}/>
      <path d="M 214 322 C 244 300 276 316 296 294" ${trazo(SW2)}/>
      <path d="M 352 320 C 378 296 410 312 428 290" ${trazo(SW2)}/>
      <line x1="150" y1="262" x2="92" y2="214" stroke="${C.tinta}" stroke-width="9" stroke-linecap="round"/>
      <line x1="170" y1="338" x2="76" y2="352" stroke="${C.tinta}" stroke-width="9" stroke-linecap="round"/>
      <line x1="76" y1="352" x2="112" y2="436" stroke="${C.tinta}" stroke-width="9" stroke-linecap="round"/>
      <circle cx="92" cy="214" r="17" ${solido(C.hueso, SW2)}/>
      <circle cx="76" cy="352" r="17" ${solido(C.hondo, SW2)}/>
      <circle cx="112" cy="436" r="17" ${solido(C.hueso, SW2)}/>
      ${barras()}`
  },

  // La depresión mayor — dos personas juntas y un amanecer: atravesarla, o acompañar a quien la atraviesa.
  'la-depresion-mayor': () => `
    ${pausa(340, 176, 56)}
    <path d="M 40 292 Q 190 272 320 286 T 590 280" fill="none" stroke="${C.gris}" stroke-width="26" stroke-linecap="round"/>
    ${persona(236, 316, { s: 1.5, color: C.sage })}
    ${persona(368, 334, { s: 1.35, color: C.hondo })}
    ${barras(488, 436)}
    <rect x="110" y="484" width="350" height="34" rx="17" ${solido(C.gris)}/>
    <line x1="158" y1="518" x2="154" y2="548" ${trazo(SW2)}/>
    <line x1="414" y1="518" x2="418" y2="548" ${trazo(SW2)}/>`,

  // Psicología aplicada a la tarea pastoral — el cayado, quien guía y la comunidad que lo rodea.
  'tarea-pastoral': () => `
    ${pausa(456, 112, 44)}
    ${barras(488, 438)}
    <path d="M 48 508 L 462 508" stroke="${C.gris}" stroke-width="24" stroke-linecap="round" fill="none"/>
    <path d="M 92 502 L 92 176 C 92 104 200 100 200 166 C 200 204 176 222 154 216" ${trazo(SW + 2)}/>
    ${persona(224, 318, { s: 1.55, color: C.sage })}
    ${persona(342, 366, { s: 1.15, color: C.hondo })}
    ${persona(418, 392, { s: 0.95, color: C.hueso })}`,

  // Operador socioterapéutico en adicciones — el salvavidas: sostén y acompañamiento, sin juicio.
  'operador-socioterapeutico': () => {
    const cx = 318
    const cy = 252
    const R = 144
    const r = 62
    const pol = (rad, deg) => [cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180)]
    const cuña = (centro) => {
      const a1 = centro - 22
      const a2 = centro + 22
      const [ox1, oy1] = pol(R, a1)
      const [ox2, oy2] = pol(R, a2)
      const [ix2, iy2] = pol(r, a2)
      const [ix1, iy1] = pol(r, a1)
      return `<path d="M ${ox1.toFixed(1)} ${oy1.toFixed(1)} A ${R} ${R} 0 0 1 ${ox2.toFixed(1)} ${oy2.toFixed(1)} L ${ix2.toFixed(1)} ${iy2.toFixed(1)} A ${r} ${r} 0 0 0 ${ix1.toFixed(1)} ${iy1.toFixed(1)} Z" fill="${C.hondo}"/>`
    }
    return `
      ${pausa(118, 112, 42)}
      <path d="M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx - R} ${cy} Z M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z" fill="${C.hueso}" fill-rule="evenodd"/>
      ${[45, 135, 225, 315].map(cuña).join('')}
      <circle cx="${cx}" cy="${cy}" r="${R}" ${trazo(SW)}/>
      <circle cx="${cx}" cy="${cy}" r="${r}" ${trazo(SW)}/>
      ${[45, 135, 225, 315]
        .map((a) => {
          const [x1, y1] = pol(r, a)
          const [x2, y2] = pol(R, a)
          return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.tinta}" stroke-width="9" stroke-linecap="round" opacity=".0"/>`
        })
        .join('')}
      <path d="M 40 470 q 28 -28 56 0 t 56 0 t 56 0 t 56 0 t 56 0 t 56 0 t 56 0" fill="none" stroke="${C.hondo}" stroke-width="15" stroke-linecap="round" opacity=".7"/>
      <path d="M 70 508 q 28 -28 56 0 t 56 0 t 56 0 t 56 0 t 56 0 t 56 0" fill="none" stroke="${C.gris}" stroke-width="15" stroke-linecap="round"/>
      ${barras()}`
  },
}


// Escena propia del programa "Operador Socioterapéutico" (Material de formación): la persona al centro
// de las cuatro dimensiones del recorrido —clínica, familiar, social y espiritual—. A diferencia del
// salvavidas de arriba (el programa de prueba "Operador Terapeutico"), esta ilustra la propuesta:
// quien acompaña articula las cuatro, no reemplaza a ninguna.
ESCENAS['operador-socioterapeutico-programa'] = () => {
  const centro = { x: 310, y: 330 }
  const nodos = [
    { x: 132, y: 156, fill: C.hondo, glifo: 'cruz' },
    { x: 488, y: 156, fill: C.hueso, glifo: 'luz' },
    { x: 126, y: 382, fill: C.gris, glifo: 'casa' },
    { x: 494, y: 382, fill: C.crema, glifo: 'red' },
  ]
  const R = 64
  const rayo = (x, y, a, r1, r2) => {
    const c = Math.cos((a * Math.PI) / 180), sn = Math.sin((a * Math.PI) / 180)
    return `<line x1="${(x + r1 * c).toFixed(1)}" y1="${(y + r1 * sn).toFixed(1)}" x2="${(x + r2 * c).toFixed(1)}" y2="${(y + r2 * sn).toFixed(1)}" stroke="${C.tinta}" stroke-width="8" stroke-linecap="round"/>`
  }
  const glifo = (g, x, y) => {
    if (g === 'cruz') return `<path d="M ${x - 9} ${y - 30} h18 v21 h21 v18 h-21 v21 h-18 v-21 h-21 v-18 h21 z" fill="${C.hueso}" stroke="${C.tinta}" stroke-width="8" ${REMATE}/>`
    if (g === 'luz') return `${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => rayo(x, y, a, 27, 40)).join('')}<circle cx="${x}" cy="${y}" r="17" fill="${C.sage}" stroke="${C.tinta}" stroke-width="8"/>`
    if (g === 'casa') return `<path d="M ${x - 32} ${y + 2} L ${x} ${y - 28} L ${x + 32} ${y + 2}" ${trazo(9)}/><rect x="${x - 22}" y="${y + 2}" width="44" height="32" rx="4" ${solido(C.hueso, 8)}/><rect x="${x - 7}" y="${y + 16}" width="14" height="18" rx="2" fill="${C.tinta}"/>`
    const pts = [[x, y - 22], [x - 24, y + 16], [x + 24, y + 16]]
    return `<path d="M ${pts[0].join(' ')} L ${pts[1].join(' ')} L ${pts[2].join(' ')} Z" ${trazo(7)}/>${pts.map(([a, b]) => `<circle cx="${a}" cy="${b}" r="10" ${solido(C.sage, 7)}/>`).join('')}`
  }
  const id = `brillo${++_uid}`
  return `
    <defs><radialGradient id="${id}"><stop offset=".26" stop-color="${C.sage}" stop-opacity=".45"/><stop offset="1" stop-color="${C.sage}" stop-opacity="0"/></radialGradient></defs>
    <circle cx="${nodos[1].x}" cy="${nodos[1].y}" r="190" fill="url(#${id})"/>
    ${barras()}
    ${nodos.map((n) => `<line x1="${n.x}" y1="${n.y}" x2="${centro.x}" y2="${centro.y - 30}" stroke="${C.tinta}" stroke-width="9" stroke-linecap="round" opacity=".5"/>`).join('')}
    ${nodos.map((n) => `<circle cx="${n.x}" cy="${n.y}" r="${R}" ${solido(n.fill)}/>${glifo(n.glifo, n.x, n.y)}`).join('')}
    ${persona(centro.x, centro.y - 70, { s: 1.35, color: C.sage })}`
}

// ---------------------------------------------------------------------------
// Qué dice cada portada. `programaId` es la fila de public.programas a la que se asigna con
// --asignar. Títulos: sin el "Curso de" genérico (la portada ya está en /cursos, no hace
// falta repetirlo) salvo "Técnicas de", que sí es parte del nombre. Subtítulos: la
// descripción corta del programa, en la misma voz neutra que Vuelvo / Sin Culpa ("Aprende…").
// ---------------------------------------------------------------------------
const PORTADAS = [
  {
    slug: 'ansiedad-y-fobias',
    archivo: 'Ansiedad y Fobias.png',
    programaId: '4aa45448-284b-40d0-8ab1-06af3bc361cc',
    titulo: ['Ansiedad y Fobias'],
    subtitulo: 'Protocolos basados en evidencia para comprender la ansiedad y acompañar su tratamiento, paso a paso.',
  },
  {
    slug: 'herramientas-cognitivas',
    archivo: 'Herramientas Cognitivas Avanzadas.png',
    programaId: 'caef0085-8015-4480-902c-a2376fbc6141',
    titulo: ['Herramientas Cognitivas', 'Avanzadas'],
    subtitulo: 'Identifica pensamientos distorsionados, trabaja tus creencias nucleares y reescribe tu diálogo interno.',
  },
  {
    slug: 'regulacion-emocional',
    archivo: 'Tecnicas de Regulacion Emocional.png',
    programaId: 'ce105f1e-570e-4261-a1bc-e6a3e83bb597',
    titulo: ['Técnicas de', 'Regulación Emocional'],
    subtitulo: 'Herramientas prácticas y basadas en evidencia para comprender, tolerar y modular las emociones.',
  },
  {
    slug: 'neuropsicologia-aplicada',
    archivo: 'Neuropsicologia Aplicada.png',
    programaId: '931b8dc3-2dc1-44c2-802f-6ff9987be08e',
    titulo: ['Neuropsicología', 'Aplicada'],
    subtitulo: 'Cómo funcionan tu cerebro y tus hábitos, y cómo usar esa ciencia para cambiar de forma intencional.',
  },
  {
    slug: 'la-depresion-mayor',
    archivo: 'La Depresion Mayor.png',
    programaId: '60de92a8-ef0d-4670-bfb6-25c9073f74ce',
    titulo: ['La Depresión Mayor'],
    subtitulo: 'Herramientas con respaldo científico para atravesar la depresión mayor, o para acompañar a quien la atraviesa.',
  },
  {
    slug: 'tarea-pastoral',
    archivo: 'Psicologia Aplicada a la Tarea Pastoral.png',
    programaId: '22222222-2222-2222-2222-222222222222',
    titulo: ['Psicología Aplicada', 'a la Tarea Pastoral'],
    subtitulo: 'Formación de 8 semanas para la detección temprana, la contención inicial y la derivación responsable en la comunidad de fe.',
  },
  {
    slug: 'operador-socioterapeutico',
    archivo: 'Operador Socioterapeutico en Adicciones.png',
    programaId: '8bd57f3b-ee33-4327-a837-a92626da1b21',
    titulo: ['Operador Socioterapéutico', 'en Adicciones'],
    subtitulo: 'Un recorrido clínico, familiar, social y espiritual para acompañar procesos de recuperación.',
  },
  // El programa de formación "Operador Socioterapéutico" (Material de formación), creado con
  // scripts/operador-socioterapeutico/deploy.js: id fijo, distinto del programa de prueba de arriba.
  {
    slug: 'operador-socioterapeutico-programa',
    archivo: 'Operador Socioterapeutico.png',
    programaId: '33333333-3333-3333-3333-333333333333',
    titulo: ['Operador', 'Socioterapéutico'],
    subtitulo: 'Un recorrido clínico, familiar, social y espiritual para acompañar procesos de recuperación en adicciones.',
  },
]

// ---------------------------------------------------------------------------
// HTML de una portada. Banda, nombre, claim e isotipo: copiados de sin-culpa-fuente.html
// (medidos al píxel); el isotipo es public/brand/mark.png (idéntico byte a byte al base64
// embebido en esa fuente) recoloreado vía máscara.
// ---------------------------------------------------------------------------
function html(portada, markBase64) {
  const { titulo, subtitulo, slug } = portada
  const dosLineas = titulo.length > 1
  const tamTitulo = dosLineas ? 42 : 48
  const lineas = titulo.map((l) => `<span class="linea">${l}</span>`).join('')
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${ANCHO}px; height: ${ALTO}px; overflow: hidden; }
  body { font-family: 'Poppins', sans-serif; }
  .portada { position: relative; width: ${ANCHO}px; height: ${ALTO}px; background: ${C.crema}; }
  .banda { position: absolute; top: 0; left: 0; width: ${ANCHO}px; height: 134px; background: ${C.tinta}; }
  .nombre { position: absolute; left: 41px; top: 37px; font-weight: 600; font-size: 26px; line-height: 1; color: ${C.hueso}; letter-spacing: 0.2px; }
  .claim { position: absolute; left: 42px; top: 79px; font-family: 'Lora', serif; font-style: italic; font-weight: 400; font-size: 17px; line-height: 1; color: #AAB2B6; }
  .isotipo { position: absolute; right: 41px; top: 42px; width: 83px; height: 54px; background-color: #EEEFF0;
    -webkit-mask-image: url('data:image/png;base64,${markBase64}'); -webkit-mask-size: 100% 100%; -webkit-mask-repeat: no-repeat;
    mask-image: url('data:image/png;base64,${markBase64}'); mask-size: 100% 100%; mask-repeat: no-repeat; }
  .panel { position: absolute; left: ${PANEL.x}px; top: ${PANEL.y}px; width: ${PANEL.w}px; height: ${PANEL.h}px; border-radius: ${PANEL.radio}px; overflow: hidden;
    background: linear-gradient(135deg, #DFE3E7 0%, #F3F5F6 55%, #FFFFFF 100%); }
  .panel svg { display: block; width: ${PANEL.w}px; height: ${PANEL.h}px; }
  /* El bloque de texto se centra en el espacio que deja el panel: un título de una línea y uno
     de dos quedan con el mismo aire arriba y abajo, sin saltos entre portadas de la serie. */
  .texto { position: absolute; left: 54px; width: 600px; top: ${PANEL.y + PANEL.h}px; height: ${ALTO - 24 - (PANEL.y + PANEL.h)}px;
    display: flex; flex-direction: column; justify-content: center; }
  .titulo { font-weight: 700; font-size: ${tamTitulo}px; line-height: ${Math.round(tamTitulo * 1.14)}px; color: ${C.tinta}; letter-spacing: 0.3px; }
  .linea { display: block; width: max-content; white-space: nowrap; }
  .subtitulo { margin-top: 10px; font-family: 'Lora', serif; font-style: italic; font-weight: 400; font-size: 20px; line-height: 28px; color: ${C.tinta}; opacity: 0.9; }
</style></head>
<body><div class="portada">
  <div class="banda"></div>
  <div class="nombre">Elias Pacione</div>
  <div class="claim">Psicología con sentido.</div>
  <div class="isotipo"></div>
  <div class="panel"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PANEL.w} ${PANEL.h}">${ESCENAS[slug]()}</svg></div>
  <div class="texto"><div class="titulo">${lineas}</div><div class="subtitulo">${subtitulo}</div></div>
</div>
<script>
  // Ajuste fino: si una línea del título no entra en los 600 px, se baja el cuerpo de a 1 px
  // (un solo tamaño por portada, para que las dos líneas sigan pareciendo un título); y el
  // subtítulo no puede pasar de dos líneas.
  const titulo = document.querySelector('.titulo')
  let t = parseFloat(getComputedStyle(titulo).fontSize)
  const entra = () => [...titulo.querySelectorAll('.linea')].every((l) => l.getBoundingClientRect().width <= 600)
  while (!entra() && t > 26) { t -= 1; titulo.style.fontSize = t + 'px'; titulo.style.lineHeight = Math.round(t * 1.14) + 'px' }
  const sub = document.querySelector('.subtitulo')
  let s = 20
  while (sub.getBoundingClientRect().height > 28 * 2 + 1 && s > 16) { s -= 1; sub.style.fontSize = s + 'px' }
  document.title = JSON.stringify({ titulo: t, subtitulo: s })
</script></body></html>`
}

// ---------------------------------------------------------------------------
// Render: Chrome headless a 2× y bajada a 707×942 (la receta del README de portadas).
// ---------------------------------------------------------------------------
async function renderizar(portada, markBase64, tmp) {
  const archivoHtml = path.join(tmp, `${portada.slug}.html`)
  const bruto = path.join(tmp, `${portada.slug}-2x.png`)
  await writeFile(archivoHtml, html(portada, markBase64), 'utf8')
  execFileSync('google-chrome', [
    '--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${path.join(tmp, 'perfil')}`,
    '--hide-scrollbars', '--force-device-scale-factor=2', `--window-size=${ANCHO},${ALTO}`,
    `--screenshot=${bruto}`, `file://${archivoHtml}`,
  ], { stdio: 'ignore' })
  const destino = path.join(SALIDA, portada.archivo)
  await sharp(bruto).resize(ANCHO, ALTO, { kernel: 'lanczos3' }).flatten({ background: C.crema }).png({ compressionLevel: 9 }).toFile(destino)
  return destino
}

// ---------------------------------------------------------------------------
// Subida a R2 y asignación en la base. Ambas son opt-in: generar no toca nada externo.
// ---------------------------------------------------------------------------
async function subir(portadas) {
  const { S3Client, PutObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3')
  const faltan = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'].filter((v) => !process.env[v])
  if (faltan.length) throw new Error(`Faltan variables en .env.local: ${faltan.join(', ')}`)
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  })
  for (const p of portadas) {
    const Key = `${CARPETA_R2}${p.archivo}`
    const cuerpo = await readFile(path.join(SALIDA, p.archivo))
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key, Body: cuerpo, ContentType: 'image/png' }))
    // Se verifica por la API y no por el mount de rclone: ese sube en segundo plano y el
    // mtime local no prueba nada.
    const h = await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key }))
    if (h.ContentLength !== cuerpo.length) throw new Error(`R2 guardó ${h.ContentLength} bytes de ${cuerpo.length} en ${Key}`)
    console.log(`  ↑ ${Key}  (${h.ContentLength} bytes)`)
  }
}

async function asignar(portadas) {
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  for (const p of portadas) {
    const portada_key = `r2key://${CARPETA_R2}${p.archivo}`
    const { data, error } = await db.from('programas').update({ portada_key }).eq('id', p.programaId).select('id, titulo')
    if (error) throw new Error(`${p.slug}: ${error.message}`)
    if (!data?.length) throw new Error(`${p.slug}: no existe el programa ${p.programaId}`)
    console.log(`  ✓ ${data[0].titulo}  →  ${portada_key}`)
  }
}

// ---------------------------------------------------------------------------
const solo = process.argv.find((a) => a.startsWith('--solo='))?.slice(7)
const elegidas = PORTADAS.filter((p) => !solo || p.slug === solo)
if (!elegidas.length) throw new Error(`--solo=${solo}: no hay una portada con ese slug (${PORTADAS.map((p) => p.slug).join(', ')})`)

await mkdir(SALIDA, { recursive: true })
const tmp = await mkdtemp(path.join(tmpdir(), 'portadas-'))
const mark = (await readFile(path.join(RAIZ, 'public/brand/mark.png'))).toString('base64')
try {
  for (const p of elegidas) console.log(`  ✓ ${await renderizar(p, mark, tmp)}`)
} finally {
  await rm(tmp, { recursive: true, force: true })
}
if (process.argv.includes('--subir')) await subir(elegidas)
if (process.argv.includes('--asignar')) await asignar(elegidas)
if (!process.argv.includes('--subir')) console.log('(sin subir — volver a correr con --subir [--asignar] para publicarlas)')
