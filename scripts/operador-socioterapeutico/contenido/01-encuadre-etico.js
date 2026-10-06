const { nota } = require('./notas')

module.exports = {
  orden: 1,
  archivo: '01-encuadre-etico-del-programa',
  etiqueta: 'Encuadre ético del programa',
  moduloTitulo: 'Encuadre ético del programa',
  moduloDescripcion: 'Qué forma y qué no forma este programa, los tres acuerdos que sostienen el aula y los límites del rol del operador socioterapéutico.',
  leccionTitulo: 'Diapositivas · Encuadre ético del programa',
  slides: [
    {
      tipo: 'portada',
      kicker: 'Antes de empezar',
      titulo: 'Encuadre ético del programa',
      bajada: 'Acompañar, contener, orientar y trabajar en red junto a profesionales de la salud mental.',
      chips: ['Se explicita desde el primer módulo', 'Se sostiene durante todo el proceso'],
      notas: nota('E0'),
    },
    {
      tipo: 'comparacion',
      kicker: 'Qué es y qué no es',
      titulo: 'Este programa forma operadores socioterapéuticos, no terapeutas',
      izq: { titulo: 'Qué forma', tono: 'sage', items: ['Personas capacitadas para acompañar, contener y orientar', 'Que trabajan en red junto a profesionales de la salud mental'] },
      der: { titulo: 'Qué no hace', tono: 'ladrillo', items: ['No forma terapeutas', 'No sustituye la formación de grado en psicología, psiquiatría o trabajo social'] },
      notas: nota('E0'),
    },
    {
      tipo: 'tarjetas',
      kicker: 'Encuadre del aula',
      titulo: 'Tres acuerdos que sostienen el aula',
      lead: 'El facilitador del curso no diagnostica ni brinda tratamiento durante la formación.',
      tarjetas: [
        { kicker: 'Acuerdo 1', titulo: 'Confidencialidad', texto: 'Lo que se comparte en la sala queda en la sala. Es la base de cualquier espacio de formación en esta temática.' },
        { kicker: 'Acuerdo 2', titulo: 'Participación voluntaria', texto: 'Nadie está obligado a compartir su historia personal ni la de su familia. Las dinámicas son siempre voluntarias.' },
        { kicker: 'Acuerdo 3', titulo: 'Riesgo actual', texto: 'Si surge consumo activo de un menor sin supervisión, violencia o ideación suicida: se aborda en privado al finalizar y se deriva a un profesional o institución competente.', oscura: true },
      ],
      notas: nota('E1'),
    },
    {
      tipo: 'comparacion',
      kicker: 'Una distinción que ordena toda la práctica futura',
      titulo: 'Los límites del rol del operador socioterapéutico',
      izq: { titulo: 'El operador sí…', tono: 'sage', items: ['Acompaña', 'Contiene', 'Informa', 'Motiva', 'Articula con la red profesional'] },
      der: { titulo: 'El operador no…', tono: 'ladrillo', items: ['Diagnostica', 'Indica medicación', 'Reemplaza una psicoterapia', 'Sostiene solo, sin supervisión, un caso de riesgo'] },
      notas: nota('E2'),
    },
    {
      tipo: 'mapa',
      kicker: 'Mapa conceptual',
      titulo: 'El encuadre ético, de un vistazo',
      centro: 'Encuadre ético del programa',
      ramas: [
        { rel: 'define', t: 'El rol del operador', hijos: ['Acompaña, contiene, informa y motiva', 'Articula con la red profesional'] },
        { rel: 'establece', t: 'Los límites', hijos: ['No diagnostica ni indica medicación', 'No reemplaza una psicoterapia', 'No sostiene solo un caso de riesgo'] },
        { rel: 'se sostiene con', t: 'Tres acuerdos del aula', hijos: ['Confidencialidad', 'Participación voluntaria', 'Riesgo actual: en privado y con derivación'] },
      ],
      notas: nota('E0', 'E1', 'E2'),
    },
    {
      tipo: 'claves',
      titulo: 'Claves del encuadre',
      items: [
        'Este programa forma operadores socioterapéuticos, no terapeutas.',
        'La confidencialidad es la base del espacio de formación.',
        'Participar es siempre voluntario: nadie está obligado a compartir su historia.',
        'Ante un riesgo actual: se aborda en privado y se deriva a quien corresponde.',
        'El módulo 7 desarrolla estos límites en profundidad.',
      ],
      notas: nota('E2'),
    },
  ],
}
