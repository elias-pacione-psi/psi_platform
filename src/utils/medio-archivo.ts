// Al asignar un archivo de /psicologo/archivos directo como material de una lección, no
// hay un formulario previo donde el psicólogo elija "tipo de contenido" como en Agregar
// material — así que se infiere de la extensión. Reusa los valores existentes de
// tipo_contenido (drive_video, drive_audio, drive_pdf, drive_image) en vez de inventar
// unos nuevos: el código de renderizado ya sabe mostrarlos, y sumar valores nuevos solo
// repite el problema que la taxonomía tipo_medio/origen vino a resolver.
const TIPO_CONTENIDO_POR_EXTENSION: Record<string, string> = {
  mp4: 'drive_video',
  webm: 'drive_video',
  mov: 'drive_video',
  mp3: 'drive_audio',
  m4a: 'drive_audio',
  ogg: 'drive_audio',
  oga: 'drive_audio',
  wav: 'drive_audio',
  pdf: 'drive_pdf',
  jpg: 'drive_image',
  jpeg: 'drive_image',
  png: 'drive_image',
  webp: 'drive_image',
  gif: 'drive_image',
  svg: 'drive_image',
}

// null cuando la extensión no tiene forma de renderizarse en la lección (txt, md, doc,
// docx, ppt, pptx): esos archivos siguen sirviendo como referencia general, pero
// asignarlos como material de una lección dejaría la página en blanco.
export function tipoContenidoPorExtension(nombreArchivo: string): string | null {
  const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? ''
  return TIPO_CONTENIDO_POR_EXTENSION[extension] ?? null
}
