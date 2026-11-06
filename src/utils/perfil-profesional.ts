import { Video, Users, MapPin } from 'lucide-react'

// Perfil profesional de Elias — tomado de su listado público en Psychology Today
// (colegiatura, especialidades y enfoques declarados ahí). Lo comparten la introducción
// "Sobre Elías" de la landing y la página /quien-soy, que lo desarrolla: un solo lugar
// donde corregirlo cuando cambie algo.
//
// Vive acá y no en page.tsx porque Next no deja exportar datos arbitrarios desde una
// página (sólo `metadata`, `revalidate` y compañía).

// Foto de Elias que usa la introducción "Sobre Elías" de la landing (componente FotoElias).
// Es una charla presencial, provisoria: para cambiarla alcanza con reemplazar el archivo de
// public/ y, si cambian las proporciones, ajustar width/height acá.
export const FOTO_PERFIL = {
  src: '/elias-charla.jpg',
  alt: 'Elías dando una charla presencial, micrófono en mano',
  width: 758,
  height: 1127,
}

// Fotos de Elias que rotan en el carrusel de /quien-soy, en el orden en que se muestran:
// primero la charla con luz violeta (la misma de FOTO_PERFIL) y después dos de un seminario
// presencial. Todas están recortadas a 4:5 (720×900) con Elias como centro del encuadre, y
// sin metadatos; en la de la campera se encuadró por encima de la cabeza de un asistente
// que tapaba la parte baja. Para sumar, quitar o reordenar alcanza con tocar esta lista y
// los archivos de public/elias/.
export const FOTOS_PERFIL = [
  { src: '/elias/charla-escenario.jpg', alt: FOTO_PERFIL.alt },
  { src: '/elias/seminario-campera.jpg', alt: 'Elías con campera oscura y el micrófono en la mano, durante un seminario' },
  { src: '/elias/seminario-buzo.jpg', alt: 'Elías con buzo oscuro, señalando con una mano y el micrófono en la otra, durante un seminario' },
]

// Año en que se recibió. Los años de ejercicio se calculan a partir de ahí en vez de
// escribirse a mano, para que "más de 12 años" no quede viejo en cada cumpleaños del título.
export const ANIO_TITULO = 2014

export function aniosDeEjercicio(): number {
  return new Date().getFullYear() - ANIO_TITULO
}

// Especialidades declaradas en el perfil. Quedan afuera a propósito las dos más delicadas
// del listado original (ideación suicida y psicosis): en una página pública de presentación
// se prefiere mostrar el área general y que el detalle se hable en la primera consulta.
export const ESPECIALIDADES = [
  'Ansiedad',
  'Depresión',
  'Estrés',
  'Autoestima',
  'Conflictos relacionales',
  'Trauma y estrés postraumático',
  'TOC',
  'Trastorno límite de la personalidad',
  'Duelo',
  'Divorcio',
  'Conflictos familiares',
  'Crianza',
  'Infidelidad',
  'Control de la ira',
  'Insomnio',
  'Codependencia',
  'Espiritualidad',
  'Orientación vocacional',
  'Coaching de vida',
  'Psicología deportiva',
]

// Su enfoque de especialidad según el perfil; los demás son herramientas que integra.
export const ENFOQUE_PRINCIPAL = 'Terapia cognitivo-conductual'

export const ENFOQUES = [
  'Terapia cognitivo-conductual',
  'Terapia racional emotiva conductual',
  'Programación neurolingüística',
  'Mindfulness',
  'Terapia sistémica familiar',
  'Terapia cristiana',
]

export const DATOS_RAPIDOS = [
  { icono: Video, titulo: 'Modalidad', texto: 'Presencial y virtual' },
  { icono: Users, titulo: 'Atiende a', texto: 'Adolescentes, adultos y parejas' },
  { icono: MapPin, titulo: 'Dónde', texto: 'Wilde y Quilmes, Buenos Aires' },
]

export const COLEGIATURA = 'Colegio de Psicólogos de la Provincia de Buenos Aires · Distrito XII (Quilmes)'

export const CITA = 'No son los hechos o problemas lo que nos afectan, sino lo que pensamos acerca de ellos.'
