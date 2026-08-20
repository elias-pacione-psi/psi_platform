// Datos identificatorios del titular del sitio.
//
// Los usan /privacidad, /terminos y /arrepentimiento: se completan UNA sola vez acá
// y quedan consistentes en las tres páginas. Mientras alguno de los tres campos
// obligatorios siga vacío, esas páginas muestran un aviso visible de que el texto
// legal todavía no está completo — el aviso desaparece solo al completarlos, sin
// tener que tocar nada más.
//
// POR QUÉ SON OBLIGATORIOS (no es celo de más):
//  - CUIT y domicilio: la Resolución 424/2020 de la Secretaría de Comercio Interior
//    y el art. 4 de la Ley 24.240 exigen que el consumidor pueda identificar con
//    quién está contratando ANTES de comprar. Vender sin esto expone a sanción.
//  - Matrícula profesional: es lo que acredita que quien ofrece los servicios está
//    habilitado para ejercer. Para un psicólogo es la credencial central.
//
// Ninguno de los tres se puede inventar desde el código: son datos reales del
// titular. Completalos y listo.

export const DATOS_TITULAR = {
  nombre: 'Elías Roberto Pacione',
  profesion: 'Licenciado en Psicología',
  colegio: 'Colegio de Psicólogos de la Provincia de Buenos Aires — Distrito XII (Quilmes)',
  email: 'elias.psicologiaconsentido@gmail.com',
  sitio: 'eliaspacione.com',

  // Cargados el 2026-08-20 desde el documento de términos y condiciones redactado
  // para el sitio ("Terminos y condiciones _eliaspacione_.docx", secciones 1 y 16).
  matricula: 'M.P. N° 62423',
  cuit: '20-29004460-0',
  domicilio: 'Mitre 722, Quilmes, Provincia de Buenos Aires',

  // Opcional: si se completa, se muestra como vía de contacto adicional.
  telefono: '',
} as const

// Los tres que la normativa exige para operar comercio electrónico. El teléfono
// queda afuera a propósito: es una vía de contacto más, no un requisito.
export function faltanDatosTitular(): boolean {
  return !DATOS_TITULAR.matricula || !DATOS_TITULAR.cuit || !DATOS_TITULAR.domicilio
}

// Para armar la línea de identificación sin dejar huecos raros ("CUIT: ." ) cuando
// todavía falta completar algo.
export function lineaIdentificatoria(): string {
  const partes = [
    DATOS_TITULAR.nombre,
    DATOS_TITULAR.profesion,
    DATOS_TITULAR.matricula,
    DATOS_TITULAR.cuit && `CUIT ${DATOS_TITULAR.cuit}`,
  ].filter(Boolean)
  return partes.join(' · ')
}

// Fecha de última revisión del texto legal. Actualizar a mano cuando se cambie el
// contenido de /privacidad o /terminos — no usar new Date(), que mentiría diciendo
// que el texto se actualizó hoy solo porque el sitio se volvió a deployar.
export const ULTIMA_ACTUALIZACION_LEGAL = '20 de agosto de 2026'
