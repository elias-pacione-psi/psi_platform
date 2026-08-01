import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Drive/Dropbox tienen una página de PREVIEW en HTML (drive.google.com/.../preview,
// www.dropbox.com/s/...), que se puede sandboxear sin problema. Un archivo DIRECTO
// (dl.dropboxusercontent.com, y cualquier futuro proveedor tipo Cloudflare R2:
// pub-<hash>.r2.dev) en cambio se apoya en el visor nativo del navegador (PDF/video),
// que el atributo `sandbox` bloquea por completo: el iframe queda en blanco y la
// petición ni sale a la red (blocked:other). Hay que sacar el sandbox en esos casos.
const HOSTS_PREVIEW_HTML = ['drive.google.com', 'docs.google.com', 'www.dropbox.com', 'dropbox.com']

export function esPaginaDePreviewSandboxeable(url: string): boolean {
  try {
    return HOSTS_PREVIEW_HTML.includes(new URL(url).hostname)
  } catch {
    return false
  }
}
