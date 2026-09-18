// Descarga los TTF de Poppins (400/500/600/700) y Lora itálica (400/500) desde
// Google Fonts. UA de navegador viejo a propósito: es la forma de que la API
// devuelva .ttf estáticos (con un UA moderno da woff2, que resvg no mastica).
import { mkdir, writeFile } from 'node:fs/promises'

const CSS =
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Lora:ital,wght@1,400;1,500&display=swap'

const css = await (
  await fetch(CSS, { headers: { 'User-Agent': 'Mozilla/4.0' } })
).text()

await mkdir('assets/fonts', { recursive: true })

// Con el UA viejo la API devuelve un solo bloque por variante (sin comentarios
// de subset), así que alcanza con recorrer todos los @font-face.
const bloques = [...css.matchAll(/@font-face\s*{([^}]*)}/g)]
for (const b of bloques) {
  const s = b[1]
  const familia = s.match(/font-family:\s*'([^']+)'/)[1]
  const estilo = s.match(/font-style:\s*(\w+)/)[1]
  const peso = s.match(/font-weight:\s*(\d+)/)[1]
  const url = s.match(/url\(([^)]+\.ttf)\)/)[1]
  const nombre = `${familia}-${peso}${estilo === 'italic' ? '-Italic' : ''}.ttf`
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  await writeFile(`assets/fonts/${nombre}`, buf)
  console.log(`${nombre}  ${(buf.length / 1024).toFixed(0)} KB`)
}
console.log('fuentes listas en assets/fonts/')
