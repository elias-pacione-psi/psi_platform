import 'server-only'
import { existeEnR2, firmarUrlR2, r2Configurado } from './r2'

// Las ilustraciones de las páginas públicas viven en el bucket del psicólogo, igual que el
// resto del material — no en public/. Se generan con `node generar-ilustraciones.mjs
// --subir` (ese script es la fuente de los dibujos) y se sirven con URL firmada, como
// cualquier otro objeto del bucket privado: no hay dominio público de R2 configurado.
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
export const ILUSTRACIONES = {
  'cursos-leccion-grabada':
    'Ilustración de una pantalla reproduciendo una lección grabada, con el listado de lecciones del curso al costado.',
  'cursos-material-apoyo':
    'Ilustración de un libro abierto con tarjetas de video, lectura y audio: el material de apoyo de un módulo.',
  'formaciones-clase-en-vivo':
    'Ilustración de una clase en vivo: la pantalla de la presentación, quien dicta y las ventanas de quienes asisten.',
  'formaciones-grupo-cohorte':
    'Ilustración de un grupo de personas dispuestas en círculo, como la cohorte que recorre junta una formación.',
  'supervisiones-charla':
    'Ilustración de dos colegas conversando frente a una mesa, con dos globos de diálogo que se superponen.',
  'supervisiones-colegas':
    'Ilustración de una mesa de trabajo redonda vista desde arriba, con cuadernos y tazas de un encuentro entre colegas.',
  'terapia-encuentro':
    'Ilustración de dos sillones enfrentados con una mesa baja y una planta: el espacio de una sesión.',
  'terapia-espacio-individual':
    'Ilustración de un sillón junto a una ventana por la que entra luz, en un espacio tranquilo.',
  'fe-puente':
    'Ilustración de un puente que une dos orillas, con dos círculos que se superponen por encima.',
  'fe-enfoque-profesional':
    'Ilustración de un libro abierto sobre un escritorio junto a un escudo con un tilde, por el marco ético del trabajo.',
} as const

export type SlugIlustracion = keyof typeof ILUSTRACIONES

export function keyIlustracion(slug: SlugIlustracion, tema: 'claro' | 'oscuro'): string {
  return `${CARPETA_ILUSTRACIONES_R2}${slug}-${tema}.svg`
}

export type IlustracionFirmada = { claro: string; oscuro: string; alt: string }

// Firma el par claro/oscuro. Devuelve null —y el llamador muestra el placeholder— si R2 no
// está configurado o si alguno de los dos archivos no está en el bucket.
//
// El chequeo de existencia no es un lujo: firmar una URL es puro cálculo local, no consulta
// nada, así que una key inexistente igual devolvería una URL con buena pinta y la página
// terminaría con una imagen rota. Son dos HEAD por ilustración, y las páginas donde se usan
// se regeneran una vez por hora (`export const revalidate`), así que no se paga por visita.
export async function firmarIlustracion(slug: SlugIlustracion): Promise<IlustracionFirmada | null> {
  if (!r2Configurado()) return null

  const keyClaro = keyIlustracion(slug, 'claro')
  const keyOscuro = keyIlustracion(slug, 'oscuro')

  try {
    const [hayClaro, hayOscuro] = await Promise.all([existeEnR2(keyClaro), existeEnR2(keyOscuro)])
    if (!hayClaro || !hayOscuro) return null

    const [claro, oscuro] = await Promise.all([firmarUrlR2(keyClaro), firmarUrlR2(keyOscuro)])
    return { claro, oscuro, alt: ILUSTRACIONES[slug] }
  } catch (err) {
    console.error('No se pudo firmar la ilustración', slug, err instanceof Error ? err.message : err)
    return null
  }
}
