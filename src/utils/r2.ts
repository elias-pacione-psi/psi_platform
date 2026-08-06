import 'server-only'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { keyDeMarcadorR2 } from './r2-marcador'

// R2 es compatible con S3; se firma contra el endpoint privado de la cuenta
// (<account>.r2.cloudflarestorage.com), nunca contra un dominio público tipo
// pub-<hash>.r2.dev (el bucket es privado, sin acceso público).
function cliente() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    // R2 espera el bucket en la RUTA (endpoint/bucket/key), no como subdominio: sin esto
    // el SDK arma la URL con el bucket como subdominio (virtual-hosted-style, el default de
    // AWS S3 "de verdad"), que R2 no resuelve.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

// Extrae la key de R2 desde `url_recurso`/`archivo_url`, sea la marca del picker
// (r2key://, ver r2-marcador.ts) o el endpoint privado directo (por si algo quedó
// guardado como URL completa). Devuelve null si no es ninguna de las dos — Drive/Dropbox
// reales siguen su camino normal, sin pasar por acá.
export function extraerKeyDeR2(url: string): string | null {
  const keyMarcada = keyDeMarcadorR2(url)
  if (keyMarcada) return keyMarcada

  try {
    const u = new URL(url)
    if (!u.hostname.endsWith('.r2.cloudflarestorage.com')) return null
    // path-style: /<bucket>/<key> — hay que sacar el segmento del bucket
    const partes = u.pathname.replace(/^\//, '').split('/')
    return decodeURIComponent(partes.slice(1).join('/'))
  } catch {
    return null
  }
}

// Vencimiento generoso a propósito: una lección puede quedar abierta en una pestaña
// largo rato, y la firma se recalcula en cada carga de la página igual, así que la
// ventana real para un alumno mirando el material arranca de nuevo en cada visita.
const VENCIMIENTO_SEGUNDOS = 6 * 60 * 60

export async function firmarUrlR2(key: string): Promise<string> {
  return getSignedUrl(
    cliente(),
    new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    { expiresIn: VENCIMIENTO_SEGUNDOS },
  )
}

// A diferencia de firmarUrlR2 (para previsualizar: el navegador decide cómo mostrarlo),
// esta fuerza la descarga a disco sin importar el tipo de archivo. ResponseContentDisposition
// viaja firmado dentro de la URL — R2 lo devuelve como header Content-Disposition en la
// respuesta, así que ni siquiera un PDF o una imagen se navegan inline.
export async function firmarDescargaR2(key: string, nombreArchivo: string): Promise<string> {
  return getSignedUrl(
    cliente(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${nombreArchivo.replace(/["\r\n]/g, '')}"`,
    }),
    { expiresIn: VENCIMIENTO_SEGUNDOS },
  )
}

// Reemplaza url_recurso/archivo_url por un link firmado y temporal si es de R2 — el
// mismo trato para cualquier recurso, sea de una lección, de la biblioteca o de una
// entrega. Se llama recién después de validar que quien pide tiene acceso, nunca antes.
// Si la URL no es de R2, o si falla el firmado (falta configurar el token), devuelve
// null: no hay a qué degradarse mejor (a diferencia de una Public Development URL vieja,
// acá nunca hubo una URL real que sirviera de fallback).
export async function resolverUrlRecurso(url: string | null): Promise<string | null> {
  if (!url) return url
  const key = extraerKeyDeR2(url)
  if (!key) return url

  try {
    return await firmarUrlR2(key)
  } catch (err) {
    console.error('No se pudo firmar la URL de R2:', err instanceof Error ? err.message : err)
    return null
  }
}

export function r2Configurado(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  )
}

// Ventana corta a propósito, al revés que la de lectura: el navegador usa esta URL
// enseguida, apenas se elige el archivo. Cinco minutos cubren una conexión lenta con margen.
const VENCIMIENTO_SUBIDA_SEGUNDOS = 5 * 60

// Firmar el Content-Type lo vuelve parte de la firma: el PUT tiene que mandar exactamente
// ese header o R2 lo rechaza. Así el tipo declarado al pedir la URL es el único que se
// puede subir — el allowlist real vive en el caller (quién puede pedir qué Content-Type).
export async function firmarSubidaR2(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    cliente(),
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: VENCIMIENTO_SUBIDA_SEGUNDOS },
  )
}

export type ObjetoR2 = { key: string; nombre: string; tamano: number; modificado: string }
export type CarpetaR2 = { prefijo: string; nombre: string; tamano: number; modificado: string | null }
export type ListadoR2 = { carpetas: CarpetaR2[]; archivos: ObjetoR2[]; truncado: boolean }

// Tamaño total y fecha del archivo más reciente bajo un prefijo, recorriendo TODO lo que
// cuelga de él (sin Delimiter, paginado). R2/S3 no llevan esta cuenta por carpeta —
// Delimiter agrupa en CommonPrefixes pero no agrega Size ni LastModified — así que hay
// que sumarlo a mano.
async function estadisticasPrefijo(prefijo: string): Promise<{ tamano: number; modificado: string | null }> {
  let tamano = 0
  let modificado: Date | null = null
  let token: string | undefined

  do {
    const res = await cliente().send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        Prefix: prefijo,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    )
    for (const o of res.Contents ?? []) {
      if (o.Key?.endsWith('/')) continue // marcador de carpeta, no es un archivo real
      tamano += o.Size ?? 0
      if (o.LastModified && (!modificado || o.LastModified > modificado)) modificado = o.LastModified
    }
    token = res.NextContinuationToken
  } while (token)

  return { tamano, modificado: modificado?.toISOString() ?? null }
}

// Suma de todo lo que hay en el bucket, sin importar la carpeta actual — para mostrar
// "cuánto se está usando" en la cabecera de /psicologo/archivos. Incluye entregas/: cuenta
// como uso real del bucket igual que el resto, aunque esa zona no se pueda escribir ni
// borrar desde el gestor.
export async function calcularUsoTotalR2(): Promise<number> {
  const { tamano } = await estadisticasPrefijo('')
  return tamano
}

// Lista un "nivel" del bucket. R2 no tiene carpetas de verdad: con Delimiter '/' el
// propio S3 agrupa todo lo que cuelga de un tramo en CommonPrefixes, que es lo que la UI
// muestra como carpeta. Los objetos de 0 bytes terminados en '/' son los marcadores que
// crea el dashboard de Cloudflare al hacer "create folder"; se filtran para no listarlos
// como archivo.
export async function listarR2(prefijo: string): Promise<ListadoR2> {
  const res = await cliente().send(
    new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      Prefix: prefijo,
      Delimiter: '/',
      MaxKeys: 1000,
    }),
  )

  const prefijosCarpetas = (res.CommonPrefixes ?? [])
    .map((p) => p.Prefix)
    .filter((p): p is string => typeof p === 'string' && !p.slice(prefijo.length).startsWith('.'))

  // Una estadística por carpeta implica recorrer todo lo que cuelga de ella — en paralelo
  // para no pagar la latencia de cada una en serie.
  const carpetas = await Promise.all(
    prefijosCarpetas.map(async (p) => {
      const { tamano, modificado } = await estadisticasPrefijo(p)
      return { prefijo: p, nombre: p.slice(prefijo.length).replace(/\/$/, ''), tamano, modificado }
    }),
  )

  const archivos = (res.Contents ?? [])
    .map((o) => ({
      key: o.Key ?? '',
      nombre: (o.Key ?? '').slice(prefijo.length),
      tamano: o.Size ?? 0,
      modificado: o.LastModified?.toISOString() ?? '',
    }))
    .filter((o) => o.nombre !== '' && !o.nombre.endsWith('/') && !o.nombre.startsWith('.'))

  // Se avisa en vez de mentir por omisión: con más de 1000 objetos en un nivel, la UI
  // tiene que poder decir que la lista está cortada.
  return { carpetas, archivos, truncado: Boolean(res.IsTruncated) }
}

// Una "carpeta" es un objeto vacío con '/' al final — la misma convención que usa el
// dashboard de Cloudflare, así que ambos lados ven lo mismo.
export async function crearCarpetaR2(prefijo: string): Promise<void> {
  await cliente().send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: prefijo, Body: '' }),
  )
}

// Todas las keys que cuelgan de un prefijo, sin Delimiter y paginando: es lo que hace
// falta para borrar una "carpeta", que en S3 no es más que un prefijo compartido.
export async function listarKeysRecursivo(prefijo: string): Promise<string[]> {
  const keys: string[] = []
  let token: string | undefined

  do {
    const res = await cliente().send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
        Prefix: prefijo,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    )
    for (const o of res.Contents ?? []) if (o.Key) keys.push(o.Key)
    token = res.NextContinuationToken
  } while (token)

  return keys
}

// DeleteObjects acepta hasta 1000 keys por request. Una entrega suelta nunca llega, pero
// borrar una carpeta entera sí puede pasarse, así que se manda de a tandas.
export async function borrarDeR2(keys: string[]): Promise<void> {
  for (let i = 0; i < keys.length; i += 1000) {
    const tanda = keys.slice(i, i + 1000)
    await cliente().send(
      new DeleteObjectsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Delete: { Objects: tanda.map((Key) => ({ Key })) },
      }),
    )
  }
}

export async function existeEnR2(key: string): Promise<boolean> {
  try {
    await cliente().send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }))
    return true
  } catch {
    return false
  }
}

// S3 no tiene un "mover/renombrar" real: hay que copiar a la key nueva y borrar la vieja.
// El CopySource va con el bucket adelante y URL-encodeado — sin el encode, un nombre con
// espacios o caracteres especiales rompe la copia.
export async function renombrarR2(keyVieja: string, keyNueva: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME
  await cliente().send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(keyVieja)}`,
      Key: keyNueva,
    }),
  )
  await borrarDeR2([keyVieja])
}
