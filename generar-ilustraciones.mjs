// Genera las ilustraciones de las páginas públicas (cursos, formaciones, supervisiones,
// terapia individual, psicología y fe) y las sube al bucket de R2.
//
//   node generar-ilustraciones.mjs            → solo escribe los SVG en ./.ilustraciones/
//   node generar-ilustraciones.mjs --subir    → además los sube a "Imagenes del sitio/"
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

// Taza vista desde arriba, para la escena de la mesa de trabajo: el círculo solo se leía
// como un botón, el asa de costado la vuelve una taza.
function tazaDesdeArriba(t, x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 34 -12 q 24 12 0 24" ${trazo(t, 8)}/>
    <circle cx="0" cy="0" r="36" ${solido(t, t.superficie, 9)}/>
    <circle cx="0" cy="0" r="18" fill="${t.acento}" opacity="0.4"/>
  </g>`
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
// Las diez escenas — una por cada slot de imagen de las páginas públicas
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
    <path d="M 424 578 L 424 626 M 496 578 L 496 626" ${trazo(t, 10)}/>
    <rect x="350" y="626" width="220" height="22" rx="11" ${solido(t, t.superficie2, 10)}/>
    ${tarjeta(t, 830, 196, 224, 96, 'play')}
    ${tarjeta(t, 830, 316, 224, 96, 'lectura')}
    ${tarjeta(t, 830, 436, 224, 96, 'audio')}
    ${planta(t, 210, 700, 1.05)}
    ${firmaMarca(t, 940, 640)}`,

  // /cursos — "¿Para quién es?". El módulo y su material de apoyo alrededor del libro.
  'cursos-material-apoyo': (t) => `
    ${tarjeta(t, 250, 170, 190, 160, 'play', { giro: -5 })}
    ${tarjeta(t, 500, 148, 190, 160, 'lectura')}
    ${tarjeta(t, 750, 170, 190, 160, 'audio', { giro: 5 })}
    <line x1="345" y1="350" x2="480" y2="440" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    <line x1="595" y1="330" x2="595" y2="440" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    <line x1="845" y1="350" x2="710" y2="440" stroke="${t.lineaSuave}" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/>
    ${libro(t, 596, 570, 1.05)}
    ${planta(t, 1040, 690, 0.9)}
    ${firmaMarca(t, 130, 660)}`,

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
    <path d="M 206 478 L 296 414" ${trazo(t, 10)}/>
    ${persona(t, 168, 386, { s: 1.25, color: t.acento2 })}
    ${tarjeta(t, 336, 620, 168, 130, 'persona')}
    ${tarjeta(t, 546, 620, 168, 130, 'persona')}
    ${tarjeta(t, 756, 620, 168, 130, 'persona')}
    ${firmaMarca(t, 1030, 660)}`,

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
    <rect x="228" y="648" width="744" height="34" rx="17" ${solido(t, t.superficie2, 10)}/>
    <line x1="292" y1="682" x2="292" y2="772" ${trazo(t, 10)}/>
    <line x1="908" y1="682" x2="908" y2="772" ${trazo(t, 10)}/>
    <g transform="rotate(-4 600 624)">
      <rect x="536" y="596" width="128" height="52" rx="8" ${solido(t, t.superficie, 9)}/>
      <line x1="562" y1="622" x2="638" y2="622" stroke="${t.lineaSuave}" stroke-width="8" stroke-linecap="round"/>
    </g>
    ${firmaMarca(t, 1064, 726, 70)}`,

  // /supervisiones — "¿Para quién es?". La mesa de trabajo entre colegas, vista de arriba.
  'supervisiones-colegas': (t) => `
    ${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 600 476)"><rect x="516" y="182" width="168" height="60" rx="30" ${solido(t, t.superficie2, 9)}/></g>`).join('')}
    <circle cx="600" cy="476" r="252" ${solido(t, t.superficie, 10)}/>
    <circle cx="600" cy="476" r="200" fill="none" stroke="${t.lineaSuave}" stroke-width="7"/>
    <g transform="rotate(-12 600 476)"><rect x="444" y="298" width="128" height="92" rx="10" ${solido(t, t.acento2, 8)}/></g>
    <g transform="rotate(14 600 476)"><rect x="640" y="316" width="128" height="92" rx="10" ${solido(t, t.superficie2, 8)}/></g>
    <g transform="rotate(6 600 476)"><rect x="530" y="556" width="134" height="94" rx="10" ${solido(t, t.superficie2, 8)}/></g>
    ${tazaDesdeArriba(t, 452, 566)}
    ${tazaDesdeArriba(t, 756, 548)}
    <g transform="rotate(-8 600 452)"><rect x="518" y="410" width="150" height="94" rx="10" ${solido(t, t.superficie, 8)}/></g>
    <g transform="rotate(10 600 452)"><rect x="530" y="420" width="150" height="94" rx="10" ${solido(t, t.superficie, 8)}/></g>
    ${firmaMarca(t, 1060, 736, 70)}`,

  // /terapia-individual — hero. Los dos sillones enfrentados: escucha y contención.
  'terapia-encuentro': (t) => `
    <circle cx="600" cy="430" r="300" fill="${t.acento}" opacity="0.1"/>
    <circle cx="600" cy="430" r="210" fill="${t.acento}" opacity="0.08"/>
    ${sillon(t, 352, 512, { s: 1.05 })}
    ${sillon(t, 848, 512, { s: 1.05, espejado: true, relleno: t.superficie2 })}
    <ellipse cx="600" cy="612" rx="86" ry="30" ${solido(t, t.superficie, 10)}/>
    <line x1="600" y1="638" x2="600" y2="690" ${trazo(t, 10)}/>
    <line x1="556" y1="694" x2="644" y2="694" ${trazo(t, 10)}/>
    ${taza(t, 600, 560, 0.72)}
    ${planta(t, 158, 690, 1.05)}
    ${firmaMarca(t, 1042, 700)}`,

  // /terapia-individual — "Un espacio confidencial". Un espacio propio, en calma.
  'terapia-espacio-individual': (t) => `
    <path d="M 668 174 L 1002 174 L 1002 486 L 668 486 Z" fill="${t.acento}" opacity="0.14"/>
    <path d="M 668 486 L 380 786 L 250 786 L 668 300 Z" fill="${t.acento}" opacity="0.09"/>
    <path d="M 1002 486 L 700 786 L 560 786 L 1002 320 Z" fill="${t.acento}" opacity="0.07"/>
    <rect x="668" y="174" width="334" height="312" rx="12" ${trazo(t, 10)}/>
    <line x1="835" y1="174" x2="835" y2="486" ${trazo(t, 8)}/>
    <line x1="668" y1="330" x2="1002" y2="330" ${trazo(t, 8)}/>
    <rect x="644" y="486" width="382" height="22" rx="11" ${solido(t, t.superficie2, 9)}/>
    ${taza(t, 946, 442, 0.68)}
    ${sillon(t, 404, 566, { s: 1.15 })}
    ${planta(t, 214, 700, 0.95)}
    ${firmaMarca(t, 1052, 700)}`,

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

  // /psicologia-y-fe — "Rigor clínico y marco ético". El material de trabajo apoyado sobre
  // el escritorio (la línea de abajo): sin esa superficie los objetos flotaban sueltos.
  'fe-enfoque-profesional': (t) => `
    <path d="M 980 300 L 1130 360 L 1130 500 Q 1130 620 980 702 Q 830 620 830 500 L 830 360 Z" ${solido(t, t.superficie, 10)}/>
    <path d="M 918 505 L 966 556 L 1055 455" fill="none" stroke="${t.acento}" stroke-width="18" ${REMATE}/>
    ${libro(t, 520, 633, 1.05)}
    ${taza(t, 180, 658, 1)}
    <line x1="100" y1="702" x2="1160" y2="702" stroke="${t.linea}" stroke-width="10" stroke-linecap="round"/>
    ${firmaMarca(t, 140, 770, 60)}`,
}

// ---------------------------------------------------------------------------
// Armado y subida
// ---------------------------------------------------------------------------
// Qué lavado de fondo le toca a cada una: `marca` las de hero, `sage` las de la segunda
// mitad de cada página. Es el mismo criterio que ya usaban los placeholders.
const VARIANTES = {
  'cursos-leccion-grabada': 'marca',
  'cursos-material-apoyo': 'sage',
  'formaciones-clase-en-vivo': 'marca',
  'formaciones-grupo-cohorte': 'sage',
  'supervisiones-charla': 'marca',
  'supervisiones-colegas': 'sage',
  'terapia-encuentro': 'marca',
  'terapia-espacio-individual': 'sage',
  'fe-puente': 'marca',
  'fe-enfoque-profesional': 'sage',
}

function armarSvg(slug, tema) {
  const t = TEMAS[tema]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ANCHO} ${ALTO}" width="${ANCHO}" height="${ALTO}">
${fondo(t, VARIANTES[slug])}
${ESCENAS[slug](t)}
</svg>
`
}

async function generar() {
  await mkdir(SALIDA, { recursive: true })
  const escritos = []
  for (const slug of Object.keys(ESCENAS)) {
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
