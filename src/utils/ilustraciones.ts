import 'server-only'
import { etagEnR2, r2Configurado } from './r2'

// Las ilustraciones de las páginas públicas viven en el bucket del psicólogo, igual que el
// resto del material — no en public/. Se generan con `node generar-ilustraciones.mjs
// --subir` (ese script es la fuente de los dibujos) y las sirve la ruta
// src/app/ilustraciones/[archivo]/route.ts, que las lee del bucket privado.
//
// La carpeta es una carpeta normal del gestor de archivos (/psicologo/archivos), así que
// Elias puede verlas y reemplazarlas por fotografía propia el día que la tenga: alcanza con
// subir un archivo con el mismo nombre. Mientras el par claro/oscuro no exista en el
// bucket, la página cae sola al placeholder de <ImagenMuestra>.
export const CARPETA_ILUSTRACIONES_R2 = 'Imagenes del sitio/'

// Slug → texto alternativo. El slug es el nombre del archivo en el bucket (sin el sufijo
// de tema ni la extensión) y tiene que coincidir con las escenas de generar-ilustraciones.mjs.
// El alt describe la escena porque la ilustración aporta contexto a la sección: no es
// decoración pura, y con alt vacío un lector de pantalla no tendría de dónde inferirla.
//
// Cada página lleva tres: la del hero, la de "¿Qué es…?" y la del cierre.
export const ILUSTRACIONES = {
  // /cursos
  'cursos-leccion-grabada':
    'Ilustración de una pantalla reproduciendo una lección grabada sobre un escritorio, con el listado de lecciones del curso al costado.',
  'cursos-material-apoyo':
    'Ilustración de un libro abierto sobre una mesa de estudio, con tarjetas de video, lectura y audio encima: el material de apoyo de un módulo.',
  'cursos-para-quien':
    'Ilustración de tres personas sobre pequeños pedestales, cada una con una tarjeta arriba: un reloj entre el sol y la luna, por la agenda flexible; una persona sola, por estudiar sin grupo; y una pila de libros bajo una lupa, por profundizar un tema.',
  // /formaciones
  'formaciones-clase-en-vivo':
    'Ilustración de una clase en vivo: la pantalla de la presentación, quien dicta detrás de un atril y las ventanas de quienes asisten.',
  'formaciones-recorrido':
    'Ilustración de un grupo de personas al comienzo de un camino con tres calendarios que se van completando y una bandera de llegada.',
  'formaciones-grupo-cohorte':
    'Ilustración de un grupo de personas dispuestas en círculo, como la cohorte que recorre junta una formación.',
  // /supervisiones
  'supervisiones-charla':
    'Ilustración de dos colegas conversando frente a una mesa, con dos globos de diálogo que se superponen.',
  'supervisiones-caso':
    'Ilustración de dos colegas sentados a una mesa frente a una pizarra con las fichas de un caso, una lupa y una decisión marcada con un tilde.',
  'supervisiones-colegas':
    'Ilustración de tres colegas sentados alrededor de una mesa redonda, bajo una lámpara colgante, con cuadernos y tazas.',
  // /terapia-individual
  'terapia-encuentro':
    'Ilustración de dos sillones enfrentados con una mesa baja y una planta: el espacio de una sesión.',
  'terapia-umbral':
    'Ilustración de una puerta entreabierta que deja ver un cuarto luminoso con un sillón y una lámpara, y una planta afuera: el primer paso hacia una consulta.',
  'terapia-espacio-individual':
    'Ilustración de una persona sentada en un sillón junto a una ventana por la que entra luz, con una lámpara de pie y una mesita con una taza.',
  // /psicologia-y-fe
  'fe-puente':
    'Ilustración de un puente que une dos orillas, con dos círculos que se superponen por encima.',
  'fe-integral':
    'Ilustración de un árbol cuya copa son tres círculos que se cruzan, con una persona sentada en un banco debajo: mente, emociones y espiritualidad como una sola unidad.',
  'fe-enfoque-profesional':
    'Ilustración de un escritorio con un libro abierto, una biblioteca al costado y un escudo con un tilde en la pared, por el marco ético del trabajo.',
} as const

export type SlugIlustracion = keyof typeof ILUSTRACIONES
export type TemaIlustracion = 'claro' | 'oscuro'

export function keyIlustracion(slug: SlugIlustracion, tema: TemaIlustracion): string {
  return `${CARPETA_ILUSTRACIONES_R2}${slug}-${tema}.svg`
}

export type IlustracionResuelta = { claro: string; oscuro: string; alt: string }

// La URL que lleva el <img>: una ruta propia (src/app/ilustraciones/[archivo]/route.ts) en
// vez de una URL de R2 firmada. Una firma vence (6 h), y estas páginas son estáticas y se
// regeneran cada hora CON stale-while-revalidate: después de un rato sin visitas, quien llega
// primero recibe el HTML viejo, con las firmas ya vencidas, y todas las ilustraciones salen
// como imagen rota. Con una ruta propia no hay nada que venza.
//
// `v` es el ETag del archivo: cuando Elias reemplaza una ilustración la URL cambia sola
// (en la siguiente regeneración de la página), así que el navegador y el CDN pueden
// guardarla "para siempre" sin dejar nunca una versión vieja a la vista.
export function urlIlustracion(slug: SlugIlustracion, tema: TemaIlustracion, version: string): string {
  return `/ilustraciones/${slug}-${tema}.svg?v=${encodeURIComponent(version)}`
}

// Resuelve el par claro/oscuro. Devuelve null —y el llamador muestra el placeholder— si R2
// no está configurado o si alguno de los dos archivos no está en el bucket.
//
// El chequeo de existencia no es un lujo: armar la URL es puro cálculo local, no consulta
// nada, así que una ilustración borrada igual daría una URL con buena pinta y la página
// terminaría con una imagen rota. Son dos HEAD por ilustración (ya traen el ETag), y las
// páginas donde se usan se regeneran una vez por hora (`export const revalidate`), así que
// no se paga por visita.
export async function resolverIlustracion(slug: SlugIlustracion): Promise<IlustracionResuelta | null> {
  if (!r2Configurado()) return null

  try {
    const [versionClaro, versionOscuro] = await Promise.all([
      etagEnR2(keyIlustracion(slug, 'claro')),
      etagEnR2(keyIlustracion(slug, 'oscuro')),
    ])
    if (!versionClaro || !versionOscuro) return null

    return {
      claro: urlIlustracion(slug, 'claro', versionClaro),
      oscuro: urlIlustracion(slug, 'oscuro', versionOscuro),
      alt: ILUSTRACIONES[slug],
    }
  } catch (err) {
    console.error('No se pudo resolver la ilustración', slug, err instanceof Error ? err.message : err)
    return null
  }
}
