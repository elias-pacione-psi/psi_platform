import 'server-only'
import { firmarUrlR2, listarKeysRecursivo, r2Configurado } from './r2'
import { extensionDe } from './r2-marcador'

// La galería de /quien-soy no tiene tabla ni panel propio: es una carpeta del bucket que
// Elias maneja desde /psicologo/archivos, igual que las ilustraciones del sitio (ver
// ilustraciones.ts). Cada subcarpeta es un álbum —un evento, un seminario— y su nombre es
// el título que se muestra. Las fotos sueltas directamente en esta carpeta salen primero,
// sin título. Subir una foto o crear un álbum no requiere deploy: la página se regenera
// sola cada hora (`export const revalidate` en quien-soy/page.tsx).
//
// Para controlar el orden de los álbumes alcanza con el nombre de la carpeta, que se
// ordena de forma natural ("2026 Jornada" antes que "2027 Jornada", "Foro 2" antes que
// "Foro 10"); lo mismo con las fotos dentro de cada una.
export const CARPETA_GALERIA_QUIEN_SOY_R2 = 'Imagenes del sitio/Quien soy/'

// Sin SVG a propósito: acá entran fotos, y un SVG puede traer contenido activo.
const EXTENSIONES_FOTO = ['jpg', 'jpeg', 'png', 'webp']

export type FotoGaleria = { url: string; alt: string; pie: string | null }
export type AlbumGaleria = { titulo: string | null; fotos: FotoGaleria[] }

const comparar = new Intl.Collator('es', { numeric: true, sensitivity: 'base' }).compare

// El nombre del archivo hace de epígrafe, pero las cámaras y WhatsApp nombran todo como
// IMG_4821 / WhatsApp Image 2026-… — publicar eso como pie de foto queda mal. Si el nombre
// tiene pinta de nombre automático, la foto va sin epígrafe en vez de con basura.
const NOMBRE_AUTOMATICO =
  /^(whatsapp|(img|dsc|dscn|dscf|pxl|mvimg|photo|foto|image|imagen|screenshot|captura|wa)[\s_.-]*\d)/i

// "01_apertura", "2 - cierre": un número corto seguido de guion o guion bajo es el orden
// que Elias le puso al archivo, no parte del epígrafe. El lookahead deja intacto lo que
// arranca como fecha ("12-03-2026 charla") y el punto no cuenta como separador ("1.5 horas").
const PREFIJO_DE_ORDEN = /^\d{1,3}\s*[_-]+\s*(?!\d)/

function pieDesdeNombre(nombreArchivo: string): string | null {
  const limpio = nombreArchivo
    .replace(/\.[^.]+$/, '')
    .replace(PREFIJO_DE_ORDEN, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!limpio || NOMBRE_AUTOMATICO.test(limpio) || !/\p{L}/u.test(limpio)) return null
  return limpio
}

// Devuelve [] (y la página oculta la sección) si R2 no está configurado, si la carpeta
// todavía no existe o si el listado falla: la galería es un extra, no puede tirar abajo la
// página que la contiene.
export async function listarGaleriaQuienSoy(): Promise<AlbumGaleria[]> {
  if (!r2Configurado()) return []

  try {
    const keys = await listarKeysRecursivo(CARPETA_GALERIA_QUIEN_SOY_R2)

    const porAlbum = new Map<string, string[]>()
    for (const key of keys) {
      const relativa = key.slice(CARPETA_GALERIA_QUIEN_SOY_R2.length)
      // Marcadores de carpeta (terminan en '/') y archivos ocultos del gestor.
      if (!relativa || relativa.endsWith('/') || relativa.startsWith('.') || relativa.includes('/.')) continue
      if (!EXTENSIONES_FOTO.includes(extensionDe(relativa))) continue

      // Un solo nivel de álbum: lo que esté en subcarpetas más profundas se agrupa bajo
      // la carpeta de primer nivel, para que el título siga siendo el del evento.
      const [primero, ...resto] = relativa.split('/')
      const album = resto.length > 0 ? primero : ''
      porAlbum.set(album, [...(porAlbum.get(album) ?? []), key])
    }

    const albumes = await Promise.all(
      [...porAlbum.entries()]
        .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : comparar(a, b)))
        .map(async ([titulo, keysAlbum]) => ({
          titulo: titulo || null,
          fotos: await Promise.all(
            keysAlbum
              .sort((a, b) => comparar(a, b))
              .map(async (key) => {
                const nombre = key.split('/').pop() ?? key
                const pie = pieDesdeNombre(nombre)
                return {
                  url: await firmarUrlR2(key),
                  pie,
                  alt: pie ?? (titulo ? `Foto de ${titulo}` : 'Foto de un encuentro de Elias'),
                }
              }),
          ),
        })),
    )

    return albumes
  } catch (err) {
    console.error('No se pudo armar la galería de /quien-soy:', err instanceof Error ? err.message : err)
    return []
  }
}
