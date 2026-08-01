import { obtenerUrlSubidaEntregaR2 } from '@/app/alumno/actions'

// Pide al servidor una URL firmada de subida (el secret key de R2 nunca sale de ahí)
// y sube el archivo directo a Cloudflare R2 con un PUT desde el navegador. El
// Content-Type va firmado junto con la URL (ver firmarSubidaR2 en utils/r2.ts): el PUT
// tiene que mandar exactamente ese header o R2 rechaza la subida.
export async function subirEntregaAR2(
  file: File,
  leccionId: string
): Promise<{ key: string } | { error: string }> {
  const res = await obtenerUrlSubidaEntregaR2(file.name, file.type, leccionId)
  if (!res.success || !res.url || !res.key) {
    return { error: res.error || 'No se pudo generar la URL de subida a R2' }
  }

  const subida = await fetch(res.url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!subida.ok) {
    return { error: `Error subiendo el archivo a R2 (HTTP ${subida.status})` }
  }

  return { key: res.key }
}
