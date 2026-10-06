// Genera las ilustraciones de las páginas públicas (cursos, formaciones, supervisiones,
// terapia individual, psicología y fe) y las sube al bucket de R2.
//
//   node generar-ilustraciones.mjs            → solo escribe los SVG en ./.ilustraciones/
//   node generar-ilustraciones.mjs --subir    → además los sube a "Imagenes del sitio/"
//   node generar-ilustraciones.mjs --solo=fe-integral,terapia-umbral   → solo esas escenas
//
// ESTE ARCHIVO ES LA FUENTE. Los SVG generados no se versionan (están en .gitignore):
// la copia publicada vive en el bucket, igual que el resto del material del psicólogo.
// Para retocar una ilustración se edita la escena de acá y se vuelve a correr con --subir.
//
// Por qué SVG y no PNG/JPG: son dibujos vectoriales planos (unos pocos KB), se ven
// nítidos en cualquier pantalla y el archivo es texto, así que un cambio de paleta es un
// diff legible. No llevan texto adentro a propósito — dentro de un <img> el SVG no puede
// cargar Poppins/Lora, así que cualquier palabra saldría con una tipografía ajena.
//
// Por qué dos versiones de cada una (claro/oscuro): el <img> tampoco ve la clase `dark`
// del documento, así que el tema no puede resolverse dentro del SVG. Se generan las dos y
// el intercambio lo hace CSS desde afuera (ver src/components/IlustracionSitio.tsx).
//
// Los slugs de acá tienen que coincidir con las claves de ILUSTRACIONES en
// src/utils/ilustraciones.ts — es lo que une el archivo del bucket con su lugar en la página.
// Cada página lleva tres: la del hero, la de "¿Qué es…?" y la del cierre. Una escena nueva
// necesita su alt en ILUSTRACIONES y su <IlustracionSitio> en la página; una que ya existe
// se reemplaza con --subir y se ve en vivo apenas la página se regenera (hasta 1 hora),
// sin deploy: la ruta /ilustraciones la lee del bucket y la versión (`?v=`) sale del ETag.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SALIDA = '.ilustraciones'
const CARPETA_R2 = 'Imagenes del sitio/'
const ANCHO = 1200
const ALTO = 900

// ---------------------------------------------------------------------------
// Paleta — espejo de los tokens de src/app/globals.css (Propuesta 2 del brief)
// ---------------------------------------------------------------------------
// `base` es exactamente el fondo de la tarjeta que envuelve la imagen (--card), así que
// el dibujo se funde con el borde del <figure> en vez de cortar contra un rectángulo.
// En oscuro las superficies suben de tono (no bajan): el trazo es claro y necesita algo
// más oscuro debajo, al revés que en el tema claro.
const TEMAS = {
  claro: {
    base: '#ffffff',
    superficie: '#f1f0eb', // crema — papel, cuerpo de los muebles
    superficie2: '#d6dee5', // gris cálido — apoyos, segundo plano
    linea: '#2f3e46', // tinta
    lineaSuave: 'rgba(47, 62, 70, 0.28)',
    acento: '#4e6478', // marca
    acento2: '#a8b79f', // sage
    acento3: '#7f95a6', // sage hondo
    contraste: '#ffffff', // calado sobre el acento (triángulo de play, tildes)
    alerta: '#b3372f', // destructive — el punto de "en vivo"
    lavadoOpacidad: [0.22, 0.06],
  },
  oscuro: {
    base: '#26323a',
    superficie: '#31404a',
    superficie2: '#3d4d58',
    linea: '#f7f6f3',
    lineaSuave: 'rgba(247, 246, 243, 0.3)',
    acento: '#8ba3b5',
    acento2: '#7f95a6',
    acento3: '#a8b79f',
    contraste: '#1e282e',
    alerta: '#ff6b5e',
    lavadoOpacidad: [0.3, 0.08],
  },
}

// ---------------------------------------------------------------------------
// Piezas reutilizables
// ---------------------------------------------------------------------------
const REMATE = 'stroke-linecap="round" stroke-linejoin="round"'

// Trazo sin relleno / forma rellena con contorno. Todo el dibujo usa estos dos para que
// el grosor de línea sea consistente entre escenas (10 lo principal, 8 lo secundario).
const trazo = (t, ancho = 10) => `fill="none" stroke="${t.linea}" stroke-width="${ancho}" ${REMATE}`
const solido = (t, relleno, ancho = 10) =>
  `fill="${relleno}" stroke="${t.linea}" stroke-width="${ancho}" ${REMATE}`

// Fondo: el lavado diagonal que ya tenía el placeholder (marca o sage según el slot) más
// un círculo muy tenue arriba a la derecha, que es la "pausa" del brief y lo que le da
// aire a composiciones por lo demás bastante geométricas.
function fondo(t, variante) {
  const color = variante === 'sage' ? t.acento2 : t.acento
  const [o1, o2] = t.lavadoOpacidad
  return `
  <defs>
    <linearGradient id="lavado" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity="${o1}"/>
      <stop offset="0.55" stop-color="${color}" stop-opacity="${o2}"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${ANCHO}" height="${ALTO}" fill="${t.base}"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#lavado)"/>
  <circle cx="1010" cy="150" r="240" fill="${t.acento3}" opacity="0.1"/>`
}

// Las tres barras inclinadas del isotipo (public/brand/mark.png), muy bajas de opacidad.
// Es la firma que repite en las diez: sin esto cada dibujo se defendía solo, pero la
// serie no se leía como de la misma marca.
function firmaMarca(t, x, y, alto = 84) {
  const barra = (i) => {
    const dx = i * 38
    return `<line x1="${x + dx + 26}" y1="${y}" x2="${x + dx}" y2="${y + alto}" stroke="${t.linea}" stroke-width="16" stroke-linecap="round"/>`
  }
  return `<g opacity="0.14">${barra(0)}${barra(1)}${barra(2)}</g>`
}

// Persona: cabeza y hombros, sin cara. Es deliberado — son personas cualquiera (un alumno,
// un colega, un consultante), y dibujarles rasgos las volvería personajes concretos.
function persona(t, x, y, { s = 1, color, ancho = 10 } = {}) {
  const relleno = color ?? t.superficie
  const r = 34 * s
  const hombroY = y + 50 * s
  const baseY = y + 122 * s
  const mitad = 52 * s
  return `<g>
    <path d="M ${x - mitad} ${baseY} Q ${x - mitad} ${hombroY} ${x} ${hombroY} Q ${x + mitad} ${hombroY} ${x + mitad} ${baseY} Z" ${solido(t, relleno, ancho)}/>
    <circle cx="${x}" cy="${y}" r="${r}" ${solido(t, relleno, ancho)}/>
  </g>`
}

// Planta en maceta — la nota cálida que el brandbook pone con las sombras de hojas.
function planta(t, x, y, s = 1) {
  const hoja = (giro) =>
    `<ellipse cx="0" cy="${-56 * s}" rx="${17 * s}" ry="${44 * s}" transform="rotate(${giro})" ${solido(t, t.acento2, 8)}/>`
  return `<g transform="translate(${x} ${y})">
    <line x1="0" y1="0" x2="0" y2="${-64 * s}" ${trazo(t, 7)}/>
    ${hoja(-26)}${hoja(24)}${hoja(0)}
    <path d="M ${-38 * s} 0 L ${38 * s} 0 L ${28 * s} ${62 * s} L ${-28 * s} ${62 * s} Z" ${solido(t, t.superficie2, 9)}/>
  </g>`
}

// Taza con vapor. El isotipo del brief es justamente una taza ("La Escucha"), así que
// aparece en las escenas de encuentro como guiño, no como objeto de relleno.
function taza(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -26 -14 q -6 -22 8 -30 M 6 -16 q -6 -22 8 -30" ${trazo(t, 7)}/>
    <path d="M -30 0 L 30 0 L 23 44 L -23 44 Z" ${solido(t, t.superficie, 9)}/>
    <path d="M 30 8 q 24 12 0 26" ${trazo(t, 9)}/>
  </g>`
}

// Libro abierto, visto de frente. Lo comparten la escena de material de apoyo y la de
// enfoque profesional; el resto de cada escena es lo que las diferencia.
function libro(t, x, y, s = 1) {
  const renglon = (dx, i) =>
    `<line x1="${dx}" y1="${34 + i * 26}" x2="${dx + 150}" y2="${28 + i * 26}" stroke="${t.lineaSuave}" stroke-width="8" stroke-linecap="round"/>`
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 -66 C -80 -96 -180 -96 -260 -66 L -260 66 C -180 36 -80 36 0 66 Z" ${solido(t, t.superficie, 10)}/>
    <path d="M 0 -66 C 80 -96 180 -96 260 -66 L 260 66 C 180 36 80 36 0 66 Z" ${solido(t, t.superficie, 10)}/>
    <line x1="0" y1="-66" x2="0" y2="66" ${trazo(t, 10)}/>
    ${[0, 1, 2].map((i) => renglon(-236, i)).join('')}
    ${[0, 1, 2].map((i) => renglon(86, i)).join('')}
  </g>`
}

// Sillón de perfil, mirando a la derecha. `espejado` lo da vuelta para armar el par
// enfrentado de la escena de terapia. El respaldo es ancho y no muy alto a propósito: con
// la proporción alta y flaca de la primera versión el mueble se leía como una lámpara.
function sillon(t, x, y, { s = 1, espejado = false, relleno } = {}) {
  const cuerpo = relleno ?? t.superficie
  return `<g transform="translate(${x} ${y}) scale(${espejado ? -s : s} ${s})">
    <line x1="-50" y1="94" x2="-58" y2="142" ${trazo(t, 9)}/>
    <line x1="74" y1="94" x2="84" y2="142" ${trazo(t, 9)}/>
    <rect x="-90" y="-146" width="84" height="198" rx="38" ${solido(t, cuerpo, 10)}/>
    <rect x="-90" y="26" width="186" height="70" rx="32" ${solido(t, cuerpo, 10)}/>
    <rect x="58" y="-24" width="48" height="66" rx="23" ${solido(t, t.superficie2, 10)}/>
  </g>`
}

// Globo de diálogo con la cola incluida en el mismo contorno: dibujarla como triángulo
// aparte deja la línea del borde cruzando el globo. `fill-opacity` en vez de un fill
// translúcido para que el contorno quede opaco y los dos globos se puedan superponer.
function globo(t, x, y, w, h, { colaX, color, opacidad = 0.3, r = 38 }) {
  const d = [
    `M ${x + r} ${y}`,
    `H ${x + w - r}`,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${colaX + 26}`,
    `L ${colaX} ${y + h + 54}`,
    `L ${colaX - 26} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ')
  return `<path d="${d}" fill="${color}" fill-opacity="${opacidad}" stroke="${t.linea}" stroke-width="8" ${REMATE}/>`
}

// Tarjeta de contenido (una lección, un recurso). `glifo` decide qué se ve adentro:
// el triángulo de play, renglones de lectura o barras de audio.
function tarjeta(t, x, y, w, h, glifo, { giro = 0 } = {}) {
  const cx = w / 2
  const cy = h / 2
  const dibujos = {
    play: `<circle cx="${cx}" cy="${cy}" r="30" fill="${t.acento}"/>
           <path d="M ${cx - 11} ${cy - 16} L ${cx + 17} ${cy} L ${cx - 11} ${cy + 16} Z" fill="${t.contraste}"/>`,
    lectura: `${[0, 1, 2].map((i) => `<line x1="${cx - 40}" y1="${cy - 24 + i * 24}" x2="${cx + (i === 2 ? 8 : 40)}" y2="${cy - 24 + i * 24}" stroke="${t.acento}" stroke-width="10" stroke-linecap="round"/>`).join('')}`,
    audio: `${[26, 46, 30, 54, 34].map((alto, i) => `<line x1="${cx - 40 + i * 20}" y1="${cy - alto / 2}" x2="${cx - 40 + i * 20}" y2="${cy + alto / 2}" stroke="${t.acento}" stroke-width="10" stroke-linecap="round"/>`).join('')}`,
    persona: `<circle cx="${cx}" cy="${cy - 14}" r="15" fill="${t.acento}"/>
              <path d="M ${cx - 26} ${cy + 30} q 0 -28 26 -28 q 26 0 26 28 Z" fill="${t.acento}"/>`,
  }
  return `<g transform="translate(${x} ${y}) rotate(${giro})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" ${solido(t, t.superficie, 8)}/>
    ${dibujos[glifo]}
  </g>`
}

// ---------------------------------------------------------------------------
// Piezas de ambiente — escenas con cuarto, personas y recorridos
// ---------------------------------------------------------------------------
// La primera tanda eran objetos sueltos sobre el lavado de fondo. Estas piezas arman
// ambientes: piso, sombras de apoyo, luz (ventana, lámparas) y personas sentadas, que es
// lo que le faltaba a las escenas de la segunda mitad de cada página — justo las que
// hablan de "para quién es" y no tenían a nadie dibujado.

// Sombra de apoyo: una elipse muy tenue bajo lo que descansa en el piso. Sin ella los
// objetos tocaban el suelo en un solo punto y la escena flotaba.
function sombra(t, cx, cy, rx, ry = Math.max(8, rx * 0.12), opacidad = 0.08) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${t.linea}" opacity="${opacidad}"/>`
}

// Piso de un ambiente: una banda que sube de tono, con una línea fina arriba. Es lo que
// convierte los objetos sueltos en un cuarto.
function piso(t, y) {
  return `<rect x="0" y="${y}" width="${ANCHO}" height="${ALTO - y}" fill="${t.superficie2}" opacity="0.5"/>
  <line x1="0" y1="${y}" x2="${ANCHO}" y2="${y}" stroke="${t.lineaSuave}" stroke-width="6"/>`
}

// Ficha genérica: la tarjeta de `tarjeta()` pero con un dibujo propio adentro (coordenadas
// locales, centradas en la ficha). Las de "para quién es" necesitan glifos que no son
// play/lectura/audio.
function ficha(t, x, y, w, h, interior, { giro = 0, relleno } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${giro})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="18" ${solido(t, relleno ?? t.superficie, 8)}/>
    <g transform="translate(${w / 2} ${h / 2})">${interior}</g>
  </g>`
}

// Sol y luna chicos, para decir "a cualquier hora" sin escribirlo.
function sol(t, x, y, r) {
  const rayos = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    const c = Math.cos(a)
    const s = Math.sin(a)
    return `<line x1="${(x + c * r * 1.45).toFixed(1)}" y1="${(y + s * r * 1.45).toFixed(1)}" x2="${(x + c * r * 1.85).toFixed(1)}" y2="${(y + s * r * 1.85).toFixed(1)}" stroke="${t.linea}" stroke-width="6" stroke-linecap="round"/>`
  }).join('')
  return `${rayos}<circle cx="${x}" cy="${y}" r="${r}" ${solido(t, t.acento3, 7)}/>`
}

function luna(t, x, y, r) {
  return `<path transform="translate(${x} ${y})" d="M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${r * 1.3} ${r * 1.3} 0 0 0 0 ${-r} Z" ${solido(t, t.acento, 7)}/>`
}

// Lupa: el lente va tenue para que se vea lo que hay debajo.
function lupa(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <line x1="44" y1="44" x2="96" y2="98" ${trazo(t, 14)}/>
    <circle cx="0" cy="0" r="58" fill="${t.acento}" fill-opacity="0.16" stroke="${t.linea}" stroke-width="10"/>
    <path d="M -34 -14 A 38 38 0 0 1 -6 -38" stroke="${t.contraste}" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.8"/>
  </g>`
}

// Escudo con tilde: el marco ético. (x, y) es el punto de arriba al centro.
function escudo(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 0 L 150 60 L 150 200 Q 150 320 0 402 Q -150 320 -150 200 L -150 60 Z" ${solido(t, t.superficie, 10)}/>
    <path d="M -62 205 L -14 256 L 75 155" fill="none" stroke="${t.acento}" stroke-width="18" ${REMATE}/>
  </g>`
}

// Pantalla de lámpara + luz. `lamparaDePie` apoya en el piso (y = piso); `lamparaColgante`
// cuelga de un cable que sube hasta el borde de la imagen (y = donde queda la pantalla).
function lamparaDePie(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -64 -292 L -190 -120 L 190 -120 L 64 -292 Z" fill="${t.acento3}" opacity="0.1"/>
    <ellipse cx="0" cy="0" rx="48" ry="10" ${solido(t, t.superficie2, 8)}/>
    <line x1="0" y1="-4" x2="0" y2="-300" ${trazo(t, 9)}/>
    <path d="M -64 -292 L 64 -292 L 42 -382 L -42 -382 Z" ${solido(t, t.superficie, 9)}/>
  </g>`
}

function lamparaColgante(t, x, y, s = 1) {
  return `<line x1="${x}" y1="0" x2="${x}" y2="${y - 78 * s}" ${trazo(t, 7)}/>
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -96 0 L -300 300 L 300 300 L 96 0 Z" fill="${t.acento3}" opacity="0.1"/>
    <path d="M -96 0 Q -96 -80 0 -80 Q 96 -80 96 0 Z" ${solido(t, t.superficie, 9)}/>
  </g>`
}

function lamparaDeEscritorio(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -50 -52 L -120 56 L 40 56 Z" fill="${t.acento3}" opacity="0.12"/>
    <ellipse cx="0" cy="0" rx="40" ry="8" ${solido(t, t.superficie2, 8)}/>
    <path d="M 0 -4 L 0 -70 L 44 -130" ${trazo(t, 8)}/>
    <path d="M 20 -150 L 74 -112 L 100 -140 L 46 -178 Z" ${solido(t, t.superficie, 8)}/>
  </g>`
}

// Ventana con marco y alféizar. `sol` suma el disco de luz arriba a la derecha.
function ventana(t, x, y, w, h, { sol = false } = {}) {
  const cx = x + w / 2
  const cy = y + h / 2
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${t.acento}" fill-opacity="0.14" stroke="${t.linea}" stroke-width="10" ${REMATE}/>
    ${sol ? `<circle cx="${x + w * 0.72}" cy="${y + h * 0.27}" r="${Math.min(w, h) * 0.11}" fill="${t.acento3}" opacity="0.55"/>` : ''}
    <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + h}" ${trazo(t, 8)}/>
    <line x1="${x}" y1="${cy}" x2="${x + w}" y2="${cy}" ${trazo(t, 8)}/>
    <rect x="${x - 22}" y="${y + h}" width="${w + 44}" height="22" rx="11" ${solido(t, t.superficie2, 9)}/>
  </g>`
}

// Sillón visto de frente. El origen es el centro del borde de arriba del asiento; `ocupante`
// (SVG en coordenadas locales) se dibuja ENTRE el respaldo y el asiento/apoyabrazos, así
// la persona queda hundida en el sillón en vez de pegada encima.
function sillonFrontal(t, x, y, { s = 1, relleno, ocupante = '' } = {}) {
  const cuerpo = relleno ?? t.superficie
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <line x1="-98" y1="84" x2="-108" y2="132" ${trazo(t, 9)}/>
    <line x1="98" y1="84" x2="108" y2="132" ${trazo(t, 9)}/>
    <rect x="-112" y="-178" width="224" height="190" rx="54" ${solido(t, cuerpo, 10)}/>
    ${ocupante}
    <rect x="-124" y="0" width="248" height="84" rx="34" ${solido(t, cuerpo, 10)}/>
    <rect x="-160" y="-54" width="58" height="146" rx="29" ${solido(t, t.superficie2, 10)}/>
    <rect x="102" y="-54" width="58" height="146" rx="29" ${solido(t, t.superficie2, 10)}/>
  </g>`
}

// Mesa de apoyo redonda con taza, vista de costado. (x, y) = el piso bajo la mesa.
function mesita(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <line x1="0" y1="-118" x2="0" y2="0" ${trazo(t, 9)}/>
    <line x1="-44" y1="0" x2="44" y2="0" ${trazo(t, 9)}/>
    <ellipse cx="0" cy="-124" rx="74" ry="16" ${solido(t, t.superficie, 9)}/>
    ${taza(t, 0, -176, 0.55)}
  </g>`
}

// Escritorio / mesa de trabajo: tablero con dos patas hasta el piso.
function escritorio(t, x, y, w, patas = 140) {
  return `<rect x="${x - w / 2}" y="${y}" width="${w}" height="32" rx="16" ${solido(t, t.superficie2, 10)}/>
  <line x1="${x - w / 2 + 56}" y1="${y + 32}" x2="${x - w / 2 + 56}" y2="${y + 32 + patas}" ${trazo(t, 10)}/>
  <line x1="${x + w / 2 - 56}" y1="${y + 32}" x2="${x + w / 2 - 56}" y2="${y + 32 + patas}" ${trazo(t, 10)}/>`
}

// Estantería con libros de distinto alto y color. Los libros siguen un patrón fijo (no
// aleatorio) para que el dibujo sea idéntico en cada corrida.
function estante(t, x, y, w, h, baldas = 3) {
  const alturaBalda = h / baldas
  const colores = [t.acento, t.acento2, t.superficie2, t.acento3, t.superficie]
  const lomos = [64, 88, 72, 100, 58, 82, 94, 68, 78, 60]
  let libros = ''
  for (let b = 0; b < baldas; b++) {
    const base = y + (b + 1) * alturaBalda
    let cursor = x + 22 + (b % 2) * 14
    for (let i = 0; cursor < x + w - 60; i++) {
      const ancho = 24 + ((i + b) % 3) * 6
      const alto = lomos[(i * 3 + b * 4) % lomos.length] * (alturaBalda / 150) + 20
      libros += `<rect x="${cursor}" y="${(base - alto - 5).toFixed(1)}" width="${ancho}" height="${alto.toFixed(1)}" rx="4" fill="${colores[(i + b * 2) % colores.length]}" stroke="${t.linea}" stroke-width="6" stroke-linejoin="round"/>`
      cursor += ancho + 8
    }
    libros += `<line x1="${x}" y1="${base}" x2="${x + w}" y2="${base}" ${trazo(t, 9)}/>`
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" ${solido(t, t.base, 10)} fill-opacity="0.6"/>${libros}`
}

// Calendario chico: el hito de un recorrido. `marcados` son los casilleros (0-5) rellenos.
function calendarioMini(t, x, y, s = 1, marcados = []) {
  const casilla = (i) => {
    const cx = -34 + (i % 3) * 34
    const cy = 8 + Math.floor(i / 3) * 30
    const marcada = marcados.includes(i)
    return `<rect x="${cx - 12}" y="${cy - 10}" width="24" height="20" rx="5" fill="${marcada ? t.acento : t.superficie2}" ${marcada ? '' : `fill-opacity="0.7"`}/>`
  }
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-70" y="-62" width="140" height="132" rx="18" ${solido(t, t.superficie, 8)}/>
    <path d="M -70 -62 H 70 V -26 H -70 Z" fill="${t.acento}" stroke="${t.linea}" stroke-width="8" stroke-linejoin="round"/>
    <line x1="-34" y1="-76" x2="-34" y2="-50" ${trazo(t, 8)}/>
    <line x1="34" y1="-76" x2="34" y2="-50" ${trazo(t, 8)}/>
    ${[0, 1, 2, 3, 4, 5].map(casilla).join('')}
  </g>`
}

// Bandera de llegada: asta + banderín.
function bandera(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <line x1="0" y1="0" x2="0" y2="-170" ${trazo(t, 10)}/>
    <path d="M 0 -170 L 96 -142 L 0 -112 Z" ${solido(t, t.acento, 9)}/>
  </g>`
}

// ---------------------------------------------------------------------------
// Las escenas — una por cada slot de imagen de las páginas públicas
// ---------------------------------------------------------------------------
const ESCENAS = {
  // /cursos — hero. "Lección grabada": el reproductor y las lecciones del curso al lado.
  'cursos-leccion-grabada': (t) => `
    <rect x="150" y="182" width="620" height="396" rx="30" ${solido(t, t.superficie, 10)}/>
    <rect x="182" y="214" width="556" height="332" rx="16" fill="${t.acento}" opacity="0.16"/>
    <circle cx="460" cy="356" r="76" fill="${t.acento}"/>
    <path d="M 437 314 L 500 356 L 437 398 Z" fill="${t.contraste}"/>
    <line x1="196" y1="500" x2="724" y2="500" stroke="${t.lineaSuave}" stroke-width="14" stroke-linecap="round"/>
    <line x1="196" y1="500" x2="404" y2="500" stroke="${t.acento}" stroke-width="14" stroke-linecap="round"/>
    ${piso(t, 806)}
    ${sombra(t, 460, 814, 420)}
    ${escritorio(t, 460, 648, 720, 126)}
    <path d="M 424 578 L 424 626 M 496 578 L 496 626" ${trazo(t, 10)}/>
    <rect x="350" y="626" width="220" height="22" rx="11" ${solido(t, t.superficie2, 10)}/>
    ${tarjeta(t, 830, 196, 224, 96, 'play')}
    ${tarjeta(t, 830, 316, 224, 96, 'lectura')}
    ${tarjeta(t, 830, 436, 224, 96, 'audio')}
    ${planta(t, 904, 744, 1.05)}
    ${firmaMarca(t, 1030, 620, 70)}`,

  // /cursos — "¿Qué es un curso asincrónico?". El módulo y su material, sobre la mesa de
  // estudio: contenido ya grabado — video, lectura, audio — que se retoma cuando se quiere.
  'cursos-material-apoyo': (t) => `
    <circle cx="596" cy="440" r="300" fill="${t.acento2}" opacity="0.13"/>
    ${tarjeta(t, 226, 112, 220, 176, 'play', { giro: -5 })}
    ${tarjeta(t, 490, 84, 220, 176, 'lectura')}
    ${tarjeta(t, 754, 112, 220, 176, 'audio', { giro: 5 })}
    <line x1="338" y1="314" x2="470" y2="484" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    <line x1="600" y1="288" x2="600" y2="484" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    <line x1="862" y1="314" x2="730" y2="484" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    ${piso(t, 826)}
    ${sombra(t, 596, 836, 440)}
    <rect x="170" y="702" width="852" height="34" rx="17" ${solido(t, t.superficie2, 10)}/>
    <line x1="252" y1="736" x2="252" y2="826" ${trazo(t, 10)}/>
    <line x1="940" y1="736" x2="940" y2="826" ${trazo(t, 10)}/>
    ${libro(t, 596, 624, 1.2)}
    ${planta(t, 976, 644, 0.92)}
    ${taza(t, 222, 662, 0.9)}
    ${firmaMarca(t, 1060, 744, 70)}`,

  // /cursos — "¿Para quién es?". Los tres perfiles del texto, uno por columna: la agenda
  // apretada (reloj con sol y luna: a cualquier hora), quien prefiere estudiar solo (una
  // persona sola, sin grupo) y quien ya tiene base y quiere profundizar un tema (la pila de
  // libros bajo la lupa).
  'cursos-para-quien': (t) => {
    const columnas = [250, 600, 950]
    const colores = [t.acento2, t.superficie, t.acento]
    const interiores = [
      `${sol(t, -78, -52, 12)}${luna(t, 80, -52, 16)}
       <circle cx="0" cy="16" r="52" ${solido(t, t.base, 8)}/>
       <line x1="0" y1="18" x2="0" y2="-16" stroke="${t.acento}" stroke-width="10" stroke-linecap="round"/>
       <line x1="0" y1="18" x2="25" y2="32" stroke="${t.acento}" stroke-width="10" stroke-linecap="round"/>
       <circle cx="0" cy="18" r="7" fill="${t.acento}"/>`,
      `<circle cx="0" cy="0" r="66" fill="none" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="3 15" stroke-linecap="round"/>
       <circle cx="0" cy="-18" r="19" fill="${t.acento}"/>
       <path d="M -36 38 q 0 -36 36 -36 q 36 0 36 36 Z" fill="${t.acento}"/>`,
      `<rect x="-72" y="18" width="144" height="28" rx="8" ${solido(t, t.acento2, 7)}/>
       <rect x="-60" y="-12" width="120" height="28" rx="8" ${solido(t, t.superficie2, 7)}/>
       <rect x="-68" y="-42" width="132" height="28" rx="8" ${solido(t, t.acento, 7)}/>
       ${lupa(t, 64, -22, 0.5)}`,
    ]
    const peana = (cx, relleno) => `
      <path d="M ${cx - 124} 664 V 724 A 124 24 0 0 0 ${cx + 124} 724 V 664" ${solido(t, relleno, 8)}/>
      <ellipse cx="${cx}" cy="664" rx="124" ry="24" ${solido(t, relleno, 8)}/>`
    return `
    ${piso(t, 728)}
    ${columnas.map((cx, i) => ficha(t, cx - 120, 104, 240, 190, interiores[i])).join('')}
    ${columnas.map((cx) => `<line x1="${cx}" y1="322" x2="${cx}" y2="410" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>`).join('')}
    ${columnas.map((cx, i) => `${peana(cx, t.superficie2)}${persona(t, cx, 494, { s: 1.35, color: colores[i] })}`).join('')}
    ${firmaMarca(t, 70, 770, 70)}`
  },

  // /formaciones — hero. "Clase en vivo": la pantalla, quien dicta y las ventanas del grupo.
  'formaciones-clase-en-vivo': (t) => `
    <rect x="300" y="150" width="660" height="392" rx="26" ${solido(t, t.superficie, 10)}/>
    <circle cx="352" cy="202" r="15" fill="${t.alerta}"/>
    <circle cx="352" cy="202" r="30" fill="none" stroke="${t.alerta}" stroke-width="7" opacity="0.45"/>
    <line x1="410" y1="202" x2="560" y2="202" stroke="${t.lineaSuave}" stroke-width="14" stroke-linecap="round"/>
    <circle cx="440" cy="352" r="66" fill="${t.acento}" opacity="0.28"/>
    <line x1="560" y1="308" x2="900" y2="308" stroke="${t.acento}" stroke-width="14" stroke-linecap="round"/>
    <line x1="560" y1="360" x2="860" y2="360" stroke="${t.lineaSuave}" stroke-width="14" stroke-linecap="round"/>
    <line x1="560" y1="412" x2="900" y2="412" stroke="${t.lineaSuave}" stroke-width="14" stroke-linecap="round"/>
    <line x1="380" y1="470" x2="880" y2="470" stroke="${t.lineaSuave}" stroke-width="10" stroke-linecap="round"/>
    ${piso(t, 800)}
    ${sombra(t, 168, 810, 120)}
    <path d="M 206 478 L 296 414" ${trazo(t, 10)}/>
    ${persona(t, 168, 386, { s: 1.25, color: t.acento2 })}
    <rect x="86" y="520" width="164" height="280" rx="14" ${solido(t, t.superficie2, 10)}/>
    <rect x="72" y="504" width="192" height="30" rx="15" ${solido(t, t.superficie, 10)}/>
    ${tarjeta(t, 336, 620, 168, 130, 'persona')}
    ${tarjeta(t, 546, 620, 168, 130, 'persona')}
    ${tarjeta(t, 756, 620, 168, 130, 'persona')}
    ${firmaMarca(t, 1030, 660)}`,

  // /formaciones — "¿Qué es una formación?". Un recorrido con hitos y fechas, hecho en grupo:
  // el calendario que se va completando, quienes arrancan juntos y la llegada.
  'formaciones-recorrido': (t) => `
    <circle cx="640" cy="440" r="340" fill="${t.acento2}" opacity="0.12"/>
    <path d="M 0 790 Q 260 700 520 782 T 1040 762 T 1200 782 V 900 H 0 Z" fill="${t.acento2}" opacity="0.28"/>
    <path d="M 0 852 Q 300 796 600 852 T 1200 842 V 900 H 0 Z" fill="${t.superficie2}" opacity="0.6"/>
    <path d="M 170 812 C 400 812 420 706 640 646 C 860 586 860 456 1040 356" fill="none" stroke="${t.acento}" stroke-opacity="0.55" stroke-width="12" stroke-dasharray="2 26" stroke-linecap="round"/>
    ${[
      [96, 664, t.acento2],
      [192, 678, t.superficie],
      [288, 660, t.acento],
    ].map(([x, y, c]) => `${sombra(t, x, y + 112, 46)}${persona(t, x, y, { s: 0.9, color: c })}`).join('')}
    ${calendarioMini(t, 470, 716, 1.2, [0, 1, 2, 3, 4, 5])}
    ${calendarioMini(t, 676, 574, 1.2, [0, 1, 2, 3])}
    ${calendarioMini(t, 874, 440, 1.2, [0, 1])}
    ${bandera(t, 1050, 354, 1.25)}
    ${planta(t, 1110, 722, 0.9)}
    ${firmaMarca(t, 90, 150, 70)}`,

  // /formaciones — "¿Para quién es?". La cohorte: el grupo que recorre la formación junto.
  'formaciones-grupo-cohorte': (t) => `
    <circle cx="600" cy="470" r="252" fill="none" stroke="${t.lineaSuave}" stroke-width="9" stroke-dasharray="18 26" stroke-linecap="round"/>
    <circle cx="600" cy="470" r="130" fill="${t.acento}" opacity="0.12"/>
    ${persona(t, 600, 196, { s: 0.92, color: t.acento2 })}
    ${persona(t, 348, 336, { s: 0.92 })}
    ${persona(t, 852, 336, { s: 0.92 })}
    ${persona(t, 404, 592, { s: 1 })}
    ${persona(t, 796, 592, { s: 1 })}
    ${taza(t, 600, 452, 1)}
    ${firmaMarca(t, 1040, 700)}`,

  // /supervisiones — hero. Dos colegas y sus dos lecturas del mismo caso, que se solapan:
  // la zona donde los globos se pisan es lo que se piensa entre los dos.
  'supervisiones-charla': (t) => `
    ${globo(t, 232, 168, 468, 156, { colaX: 424, color: t.acento, opacidad: 0.28 })}
    ${globo(t, 508, 244, 468, 156, { colaX: 812, color: t.acento2, opacidad: 0.4 })}
    ${persona(t, 404, 492, { s: 1.3 })}
    ${persona(t, 812, 492, { s: 1.3, color: t.acento2 })}
    ${piso(t, 774)}
    ${sombra(t, 600, 784, 400)}
    <rect x="228" y="648" width="744" height="34" rx="17" ${solido(t, t.superficie2, 10)}/>
    <line x1="292" y1="682" x2="292" y2="774" ${trazo(t, 10)}/>
    <line x1="908" y1="682" x2="908" y2="774" ${trazo(t, 10)}/>
    <g transform="rotate(-4 600 624)">
      <rect x="536" y="596" width="128" height="52" rx="8" ${solido(t, t.superficie, 9)}/>
      <line x1="562" y1="622" x2="638" y2="622" stroke="${t.lineaSuave}" stroke-width="8" stroke-linecap="round"/>
    </g>
    ${firmaMarca(t, 1064, 726, 70)}`,

  // /supervisiones — "¿Qué es un espacio de supervisión?". El caso sobre la pizarra, mirado
  // entre dos: se revisa una decisión, se la sopesa y se la ve desde afuera (la lupa).
  'supervisiones-caso': (t) => `
    <circle cx="800" cy="400" r="300" fill="${t.acento}" opacity="0.08"/>
    <rect x="520" y="124" width="600" height="440" rx="26" ${solido(t, t.superficie, 10)}/>
    <rect x="566" y="556" width="508" height="22" rx="11" ${solido(t, t.superficie2, 9)}/>
    ${ficha(t, 566, 186, 190, 124, `
      <circle cx="0" cy="-16" r="17" fill="${t.acento}"/>
      <path d="M -32 34 q 0 -32 32 -32 q 32 0 32 32 Z" fill="${t.acento}"/>`)}
    ${ficha(t, 884, 186, 190, 124, `
      ${[0, 1, 2].map((i) => `<line x1="-56" y1="${-28 + i * 28}" x2="${i === 2 ? 8 : 56}" y2="${-28 + i * 28}" stroke="${t.acento}" stroke-width="10" stroke-linecap="round"/>`).join('')}`)}
    <line x1="662" y1="326" x2="742" y2="388" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    <line x1="978" y1="326" x2="898" y2="388" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    ${ficha(t, 725, 372, 190, 124, `<path d="M -34 6 L -8 32 L 38 -22" fill="none" stroke="${t.base === '#ffffff' ? t.acento : t.contraste}" stroke-width="16" ${REMATE}/>`, { relleno: t.acento2 })}
    ${lupa(t, 1056, 190, 0.95)}
    ${piso(t, 792)}
    ${sombra(t, 268, 804, 250)}
    ${persona(t, 170, 470, { s: 1.4 })}
    ${persona(t, 366, 506, { s: 1.25, color: t.acento2 })}
    ${escritorio(t, 268, 640, 430, 120)}
    <path d="M 424 574 L 502 492" ${trazo(t, 10)}/>
    <circle cx="510" cy="484" r="13" ${solido(t, t.acento2, 8)}/>
    ${planta(t, 1110, 730, 1)}
    ${firmaMarca(t, 96, 150, 70)}`,

  // /supervisiones — "¿Para quién es?". Colegas alrededor de una mesa, bajo una misma luz:
  // psicólogos en ejercicio, estudiantes avanzados, un equipo que se sostiene en el tiempo.
  'supervisiones-colegas': (t) => `
    ${lamparaColgante(t, 600, 170, 1.05)}
    ${persona(t, 280, 462, { s: 1.3 })}
    ${persona(t, 600, 418, { s: 1.3, color: t.acento2 })}
    ${persona(t, 920, 462, { s: 1.3, color: t.superficie2 })}
    ${piso(t, 796)}
    ${sombra(t, 600, 808, 340)}
    <path d="M 574 690 L 556 796 M 626 690 L 644 796" ${trazo(t, 10)}/>
    <ellipse cx="600" cy="632" rx="380" ry="84" ${solido(t, t.superficie, 10)}/>
    <g transform="rotate(-10 440 624)"><rect x="384" y="586" width="112" height="76" rx="8" ${solido(t, t.acento2, 8)}/></g>
    <g transform="rotate(8 770 620)"><rect x="714" y="582" width="112" height="76" rx="8" ${solido(t, t.superficie2, 8)}/></g>
    <g transform="rotate(-3 600 646)"><rect x="544" y="608" width="112" height="76" rx="8" ${solido(t, t.base, 8)}/></g>
    ${taza(t, 500, 576, 0.6)}
    ${taza(t, 706, 568, 0.6)}
    ${firmaMarca(t, 1070, 724, 70)}`,

  // /terapia-individual — hero. Los dos sillones enfrentados: escucha y contención.
  'terapia-encuentro': (t) => `
    <circle cx="600" cy="430" r="300" fill="${t.acento}" opacity="0.1"/>
    <circle cx="600" cy="430" r="210" fill="${t.acento}" opacity="0.08"/>
    ${piso(t, 698)}
    ${sombra(t, 352, 706, 150)}
    ${sombra(t, 848, 706, 150)}
    ${sillon(t, 352, 548, { s: 1.05 })}
    ${sillon(t, 848, 548, { s: 1.05, espejado: true, relleno: t.superficie2 })}
    <ellipse cx="600" cy="612" rx="86" ry="30" ${solido(t, t.superficie, 10)}/>
    <line x1="600" y1="638" x2="600" y2="692" ${trazo(t, 10)}/>
    <line x1="556" y1="696" x2="644" y2="696" ${trazo(t, 10)}/>
    ${taza(t, 600, 560, 0.72)}
    ${planta(t, 158, 634, 1.05)}
    ${firmaMarca(t, 1042, 730)}`,

  // /terapia-individual — "¿Qué es la terapia individual?". El umbral: la puerta entreabierta
  // de un cuarto con luz, donde hay lugar para uno. Es la primera consulta vista desde afuera.
  'terapia-umbral': (t) => {
    const claro = t.base === '#ffffff'
    return `
    <circle cx="600" cy="420" r="330" fill="${t.acento2}" opacity="0.12"/>
    ${piso(t, 770)}
    <path d="M 440 770 L 760 770 L 950 900 L 250 900 Z" fill="${t.acento3}" opacity="${claro ? 0.2 : 0.16}"/>
    <defs>
      <clipPath id="vano"><rect x="440" y="170" width="320" height="600"/></clipPath>
      <radialGradient id="luz" cx="0.5" cy="0.62" r="0.7">
        <stop offset="0" stop-color="${claro ? '#ffffff' : t.linea}" stop-opacity="${claro ? 0.95 : 0.3}"/>
        <stop offset="1" stop-color="${t.acento3}" stop-opacity="${claro ? 0.22 : 0.14}"/>
      </radialGradient>
    </defs>
    <g clip-path="url(#vano)">
      <rect x="440" y="170" width="320" height="600" fill="url(#luz)"/>
      <rect x="440" y="650" width="320" height="120" fill="${t.superficie2}" fill-opacity="0.55"/>
      <line x1="440" y1="650" x2="760" y2="650" stroke="${t.lineaSuave}" stroke-width="6"/>
      ${lamparaDePie(t, 706, 700, 0.62)}
      ${sillon(t, 566, 660, { s: 0.78 })}
      ${planta(t, 482, 668, 0.62)}
    </g>
    <rect x="430" y="160" width="340" height="610" rx="8" ${trazo(t, 10)}/>
    <rect x="418" y="148" width="364" height="634" rx="12" fill="none" stroke="${t.lineaSuave}" stroke-width="7"/>
    <path d="M 430 160 L 336 122 L 336 746 L 430 770 Z" ${solido(t, t.superficie2, 10)}/>
    <path d="M 358 196 L 410 214 L 410 424 L 358 412 Z" fill="none" stroke="${t.lineaSuave}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M 358 448 L 410 458 L 410 690 L 358 700 Z" fill="none" stroke="${t.lineaSuave}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="352" cy="458" r="10" fill="${t.linea}"/>
    <rect x="470" y="780" width="260" height="26" rx="13" ${solido(t, t.acento2, 8)}/>
    <rect x="850" y="296" width="84" height="120" rx="12" ${solido(t, t.superficie, 8)}/>
    <line x1="868" y1="330" x2="916" y2="330" stroke="${t.lineaSuave}" stroke-width="8" stroke-linecap="round"/>
    <line x1="868" y1="356" x2="916" y2="356" stroke="${t.lineaSuave}" stroke-width="8" stroke-linecap="round"/>
    <line x1="868" y1="382" x2="898" y2="382" stroke="${t.lineaSuave}" stroke-width="8" stroke-linecap="round"/>
    ${planta(t, 1040, 708, 1.15)}
    ${firmaMarca(t, 96, 690, 70)}`
  },

  // /terapia-individual — "Un espacio confidencial". Una persona a salvo en su rincón: el
  // sillón junto a la ventana, la lámpara encendida, la mesita con la taza.
  'terapia-espacio-individual': (t) => `
    ${ventana(t, 700, 140, 340, 380, { sol: true })}
    ${piso(t, 776)}
    <path d="M 740 548 L 1000 548 L 930 820 L 560 820 Z" fill="${t.acento}" opacity="0.08"/>
    <ellipse cx="450" cy="838" rx="300" ry="38" fill="${t.acento2}" fill-opacity="0.32" stroke="${t.linea}" stroke-width="8"/>
    ${sillonFrontal(t, 450, 662, { s: 1.12, ocupante: persona(t, 0, -112, { s: 1, color: t.acento2 }) })}
    ${mesita(t, 804, 812, 0.95)}
    ${lamparaDePie(t, 170, 812, 0.82)}
    ${planta(t, 1080, 750, 1)}
    ${firmaMarca(t, 104, 150, 70)}`,

  // /psicologia-y-fe — hero. El puente del texto: dos orillas unidas, mente y espíritu.
  'fe-puente': (t) => `
    <circle cx="524" cy="286" r="146" fill="${t.acento}" opacity="0.24"/>
    <circle cx="676" cy="286" r="146" fill="${t.acento2}" opacity="0.34"/>
    <circle cx="524" cy="286" r="146" ${trazo(t, 8)}/>
    <circle cx="676" cy="286" r="146" ${trazo(t, 8)}/>
    <path d="M 386 664 Q 600 470 814 664" ${trazo(t, 12)}/>
    <path d="M 386 692 Q 600 498 814 692" ${trazo(t, 12)}/>
    ${[0.18, 0.36, 0.5, 0.64, 0.82].map((u) => {
      // Punto y normal de la parábola del puente para colgar los tensores derechos.
      const x = (1 - u) * (1 - u) * 386 + 2 * (1 - u) * u * 600 + u * u * 814
      const y = (1 - u) * (1 - u) * 664 + 2 * (1 - u) * u * 470 + u * u * 664
      return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 62).toFixed(1)}" stroke="${t.linea}" stroke-width="8" stroke-linecap="round" opacity="0.5"/>`
    }).join('')}
    <rect x="386" y="664" width="428" height="236" fill="${t.acento}" opacity="0.14"/>
    <path d="M 430 780 q 44 -20 88 0 t 88 0 t 88 0 t 88 0" ${trazo(t, 7)} opacity="0.45"/>
    <path d="M 408 842 q 44 -20 88 0 t 88 0 t 88 0 t 88 0" ${trazo(t, 7)} opacity="0.3"/>
    <rect x="0" y="664" width="386" height="236" fill="${t.superficie2}"/>
    <rect x="814" y="664" width="386" height="236" fill="${t.superficie2}"/>
    <path d="M 0 664 H 386 V 900" ${trazo(t, 10)}/>
    <path d="M 1200 664 H 814 V 900" ${trazo(t, 10)}/>
    ${persona(t, 600, 474, { s: 0.62, color: t.superficie })}
    ${firmaMarca(t, 1044, 200, 74)}`,

  // /psicologia-y-fe — "¿En qué consiste este espacio?". Mente, emociones y espiritualidad
  // como una sola copa sobre un mismo tronco: tres círculos que se cruzan (el eco del
  // diagrama del hero) y alguien descansando abajo.
  'fe-integral': (t) => `
    <circle cx="600" cy="340" r="360" fill="${t.acento3}" opacity="0.1"/>
    ${piso(t, 764)}
    ${sombra(t, 600, 776, 320)}
    <path d="M 524 774 C 560 754 568 702 574 640 L 578 470 L 622 470 L 626 640 C 632 702 640 754 676 774 Z" ${solido(t, t.superficie2, 10)}/>
    <circle cx="468" cy="378" r="160" fill="${t.acento}" fill-opacity="0.28" stroke="${t.linea}" stroke-width="8"/>
    <circle cx="732" cy="378" r="160" fill="${t.acento2}" fill-opacity="0.4" stroke="${t.linea}" stroke-width="8"/>
    <circle cx="600" cy="236" r="160" fill="${t.acento3}" fill-opacity="0.3" stroke="${t.linea}" stroke-width="8"/>
    ${persona(t, 856, 590, { s: 0.9, color: t.acento2 })}
    <rect x="740" y="696" width="232" height="22" rx="11" ${solido(t, t.superficie2, 9)}/>
    <line x1="768" y1="718" x2="768" y2="768" ${trazo(t, 9)}/>
    <line x1="944" y1="718" x2="944" y2="768" ${trazo(t, 9)}/>
    ${planta(t, 318, 702, 1.1)}
    ${firmaMarca(t, 1066, 700, 70)}`,

  // /psicologia-y-fe — "Rigor clínico y marco ético". El estudio de quien trabaja con
  // rigor: la biblioteca de respaldo, el libro abierto sobre el escritorio y, en la pared,
  // el escudo del marco ético y la confidencialidad.
  'fe-enfoque-profesional': (t) => `
    <circle cx="680" cy="400" r="320" fill="${t.acento}" opacity="0.07"/>
    ${estante(t, 90, 150, 300, 560, 3)}
    ${escudo(t, 1000, 150, 0.82)}
    ${piso(t, 790)}
    ${sombra(t, 700, 800, 380)}
    ${persona(t, 700, 470, { s: 1.25, color: t.acento2 })}
    ${escritorio(t, 700, 612, 560, 146)}
    ${libro(t, 700, 604, 0.55)}
    ${lamparaDeEscritorio(t, 500, 612, 0.9)}
    ${taza(t, 890, 572, 0.8)}
    ${planta(t, 1090, 728, 1)}
    ${firmaMarca(t, 110, 740, 60)}`,
}

// ---------------------------------------------------------------------------
// Armado y subida
// ---------------------------------------------------------------------------
// Qué lavado de fondo le toca a cada una. Cada página lleva tres imágenes (hero, "¿Qué es…?"
// y cierre) y el color alterna para que no se lean como la misma repetida.
const VARIANTES = {
  // hero de cada página
  'cursos-leccion-grabada': 'marca',
  'formaciones-clase-en-vivo': 'marca',
  'supervisiones-charla': 'marca',
  'terapia-encuentro': 'marca',
  'fe-puente': 'marca',
  // "¿Qué es…?" — el verde de la mitad de la página
  'cursos-material-apoyo': 'sage',
  'formaciones-recorrido': 'sage',
  'supervisiones-caso': 'sage',
  'terapia-umbral': 'sage',
  'fe-integral': 'sage',
  // cierre de la página ("¿Para quién es?", el espacio confidencial, el rigor): vuelve al
  // azul de marca, así hero y cierre encuadran a la del medio en vez de repetirse
  'cursos-para-quien': 'marca',
  'formaciones-grupo-cohorte': 'marca',
  'supervisiones-colegas': 'marca',
  'terapia-espacio-individual': 'marca',
  'fe-enfoque-profesional': 'marca',
}

function armarSvg(slug, tema) {
  const t = TEMAS[tema]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">
${fondo(t, VARIANTES[slug])}
${ESCENAS[slug](t)}
</svg>
`
}

// --solo=a,b genera (y con --subir, sube) solo esas escenas: para iterar una sin pisar el resto.
const solo = (process.argv.find((a) => a.startsWith('--solo=')) ?? '').split('=')[1]?.split(',').filter(Boolean)
if (solo) {
  const desconocidas = solo.filter((s) => !(s in ESCENAS))
  if (desconocidas.length) {
    console.error(`--solo: no existe la escena ${desconocidas.join(', ')}. Escenas: ${Object.keys(ESCENAS).join(', ')}`)
    process.exit(1)
  }
}

async function generar() {
  await mkdir(SALIDA, { recursive: true })
  const escritos = []
  for (const slug of Object.keys(ESCENAS)) {
    if (solo && !solo.includes(slug)) continue
    for (const tema of ['claro', 'oscuro']) {
      const nombre = `${slug}-${tema}.svg`
      await writeFile(path.join(SALIDA, nombre), armarSvg(slug, tema), 'utf8')
      escritos.push(nombre)
    }
  }
  console.log(`${escritos.length} ilustraciones escritas en ${SALIDA}/`)
  return escritos
}

async function subir(nombres) {
  const faltantes = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'].filter(
    (v) => !process.env[v],
  )
  if (faltantes.length) {
    console.error(`Faltan variables en .env.local: ${faltantes.join(', ')}`)
    process.exitCode = 1
    return
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })

  for (const nombre of nombres) {
    const key = `${CARPETA_R2}${nombre}`
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: await readFile(path.join(SALIDA, nombre)),
        // Sin esto R2 lo devuelve como application/octet-stream y el navegador no lo
        // dibuja: con `nosniff` en las cabeceras de la app, un <img> con el tipo
        // equivocado no se renderiza.
        ContentType: 'image/svg+xml',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
    console.log(`  ✓ ${key}`)
  }
  console.log(`${nombres.length} archivos subidos a ${process.env.R2_BUCKET_NAME}/${CARPETA_R2}`)
}

const escritos = await generar()
if (process.argv.includes('--subir')) await subir(escritos)
else console.log('(sin subir — volver a correr con --subir para publicarlas en el bucket)')
