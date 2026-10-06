const { nota, bajada } = require('./notas')

module.exports = {
  orden: 5,
  archivo: '05-modulo-4-el-ambito-familiar-como-sistema',
  etiqueta: 'Módulo 4 · El ámbito familiar como sistema',
  moduloTitulo: 'Módulo 4 · El ámbito familiar como sistema',
  moduloDescripcion: 'Comprender a la familia como sistema, identificar los roles que se organizan alrededor de la adicción y desarrollar herramientas concretas de intervención familiar.',
  leccionTitulo: 'Diapositivas · El ámbito familiar como sistema',
  slides: [
    {
      tipo: 'portada', numero: 4, kicker: 'Módulo 4 de 8 · Semana 4',
      titulo: 'El ámbito familiar como sistema',
      bajada: 'Comprender a la familia como sistema, identificar los roles que se organizan alrededor de la adicción y desarrollar herramientas concretas de intervención familiar.',
      chips: ['3 horas cátedra', '120 minutos', '7 bloques'],
      notas: bajada(4),
    },
    {
      tipo: 'objetivos',
      items: [
        'Comprender a la familia como un sistema que se reorganiza frente a la adicción.',
        'Reconocer los cuatro roles familiares descritos por la psicología familiar sistémica.',
        'Distinguir codependencia de acompañamiento saludable.',
        'Incorporar una guía práctica de qué sí y qué no hacer en la intervención familiar.',
      ],
    },
    {
      tipo: 'agenda', total: 120,
      bloques: [
        { min: 10, t: '4.1 Reconexión' },
        { min: 25, t: '4.2 La familia como sistema' },
        { min: 20, t: '4.3 Los cuatro roles familiares frente a la adicción' },
        { min: 20, t: '4.4 Codependencia: cuando ayudar sostiene el problema' },
        { min: 25, t: '4.5 Guía de intervención familiar: qué sí y qué no' },
        { min: 15, t: '4.6 Reconstruir la confianza después de una recaída' },
        { min: 5, t: '4.7 Cierre' },
      ],
    },
    {
      tipo: 'mapa', kicker: '4.2 · La familia como sistema',
      titulo: 'La familia es un sistema: no cambia solo porque se trate al integrante más sintomático',
      centro: 'Familia como sistema',
      ramas: [
        { rel: 'cada integrante cumple', t: 'Un rol y una función', hijos: ['Los roles se acomodan para sostener el equilibrio del conjunto'] },
        { rel: 'ante una adicción, suele', t: 'Ubicar a quien la padece como «el problema»', hijos: ['Tratar solo al integrante más sintomático no cambia el sistema', 'Los demás roles pueden sostener, sin querer, el mismo ciclo'] },
        { rel: 'por eso se trabaja con', t: 'La persona y la familia', hijos: ['Si la familia no se involucra, falta una pata fundamental'] },
        { rel: '«Familia» incluye a', t: 'Toda figura de crianza o autoridad afectiva', hijos: ['Abuelos, tíos, padrastros, madres o padres del corazón'] },
      ],
      notas: nota('4.2'),
    },
    {
      tipo: 'tarjetas', kicker: '4.3 · Los cuatro roles familiares',
      titulo: 'Cuatro roles que el sistema acomoda frente al dolor',
      lead: 'Son acomodamientos automáticos del sistema: ninguno es «culpa» de quien lo ocupa.',
      cols: 2, grilla: true, max: 22,
      tarjetas: [
        { kicker: 'Rol 1', titulo: 'El héroe', texto: 'Suele ser el hijo «brillante»: sostiene la imagen de normalidad de la familia frente al exterior.' },
        { kicker: 'Rol 2', titulo: 'El chivo expiatorio', texto: 'Suele ser quien desarrolla la adicción o el síntoma más visible, y carga con la culpa de todo el sistema.' },
        { kicker: 'Rol 3', titulo: 'El niño perdido', texto: 'Se vuelve invisible, no pide nada, para no sumar más carga a una familia ya sobrepasada.' },
        { kicker: 'Rol 4', titulo: 'La mascota o el bufón', texto: 'Usa el humor o la ternura para bajar la tensión familiar, muchas veces a costa de sus propias necesidades.' },
      ],
      notas: nota('4.3'),
    },
    {
      tipo: 'tarjetas', kicker: '4.4 · Codependencia',
      titulo: 'Codependencia: cuando ayudar sostiene el problema',
      lead: 'No es debilidad ni ingenuidad: muchas veces es la única forma que esa persona encontró de sentir que tiene algo de control sobre una situación que la desborda.',
      tarjetas: [
        { kicker: 'Qué es', titulo: 'Una vida emocional organizada alrededor del consumo de otro', texto: 'El familiar sostiene, sin quererlo, las mismas conductas que dice querer cambiar.' },
        { kicker: 'Cómo se ve', titulo: 'Sostener el problema', texto: 'Dar dinero sin condiciones, encubrir consecuencias, tolerar promesas incumplidas.' },
        { kicker: 'Cómo se trabaja', titulo: 'Cuidar la propia estabilidad', texto: 'No es abandonar a quien consume: es la única forma de estar disponible cuando esa persona esté lista para cambiar.', oscura: true },
      ],
      notas: nota('4.4'),
    },
    {
      tipo: 'comparacion', kicker: '4.5 · Guía de intervención familiar',
      titulo: 'Qué NO hacer y qué SÍ hacer con la familia',
      izq: { titulo: 'Qué NO hacer', tono: 'ladrillo', items: ['Dar dinero sin condiciones claras: sostiene el problema, aunque duela negarlo', 'El control constante: agota a ambos y no cambia el ciclo', 'Creer cada promesa sin cambios concretos que la acompañen', 'Sermonear o juzgar: la persona ya sabe lo que está mal'] },
      der: { titulo: 'Qué SÍ hacer', tono: 'sage', items: ['Poner límites claros, no como castigo sino como estructura: los límites son actos de amor', 'Hablar en momentos de calma, nunca durante el impulso o la intoxicación', 'Observar patrones de conducta repetidos, no solo palabras', 'Pedir ayuda también para uno mismo: grupos de apoyo, terapia, espacios propios'] },
      notas: nota('4.5'),
    },
    {
      tipo: 'comparacion', kicker: '4.6 · Reconstruir la confianza después de una recaída',
      titulo: 'La confianza se recupera con acciones pequeñas y repetidas, no con promesas grandes',
      izq: { titulo: 'Conviene trabajar con la familia', tono: 'marca', items: ['«Hoy no», más que «nunca más»', '«Esta hora», más que «para siempre»'] },
      der: { titulo: 'Conviene anticipar', tono: 'tinta', items: ['Que habrá recaídas, mentiras y momentos de tensión', 'Que eso no significa que la persona no quiera salir: es propio del proceso', 'Sostener la propia tolerancia a la frustración, sin resignarse ni dejar de acompañar'] },
      notas: nota('4.6'),
    },
    {
      tipo: 'frase',
      texto: 'Cuidarte a vos mismo no es abandonarlo. Es la única forma de estar disponible cuando esté listo para cambiar.',
      autor: 'Módulo 4 · Guía para familiares',
      notas: nota('H4'),
    },
    {
      tipo: 'claves', titulo: 'Claves del módulo',
      items: [
        'La familia es un sistema: tratar solo al integrante más sintomático no cambia el sistema.',
        'Los cuatro roles —héroe, chivo expiatorio, niño perdido y mascota— son acomodamientos del sistema frente al dolor, no culpas.',
        'La codependencia no es debilidad: ayudar sin condiciones puede sostener el problema.',
        'Límites claros como estructura, diálogo en calma y observar patrones, no solo palabras.',
        '«Hoy no» y «esta hora»: la confianza se reconstruye con acciones pequeñas y repetidas.',
      ],
    },
    {
      tipo: 'herramienta', numero: 4, nombre: 'Guía para familiares: qué sí y qué no',
      uso: 'Hoja para entregar directamente a la familia · resume en formato breve los criterios trabajados en este módulo.',
      columnas: true,
      partes: [
        { titulo: 'Evitar', estilo: 'checks', items: ['Dar dinero sin condiciones claras', 'El control constante', 'Discutir durante el impulso o la intoxicación', 'Creer cada promesa sin cambios concretos', 'Sermonear o juzgar'] },
        { titulo: 'Priorizar', estilo: 'checks', items: ['Poner límites claros, como estructura y no como castigo', 'Hablar en momentos de calma', 'Pedir ayuda para uno mismo también', 'Ajustar el diálogo a si la persona está intoxicada o no', 'Cuidar la propia estabilidad emocional'] },
      ],
      cierre: 'No podés controlar la voluntad del otro. Pero sí podés dejar de actuar a ciegas.',
      notas: nota('H4'),
    },
  ],
}
