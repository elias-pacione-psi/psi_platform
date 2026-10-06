const { nota, bajada } = require('./notas')

module.exports = {
  orden: 6,
  archivo: '06-modulo-5-contexto-social-y-adicciones-de-conducta',
  etiqueta: 'Módulo 5 · Contexto social y adicciones de conducta',
  moduloTitulo: 'Módulo 5 · Contexto social y adicciones de conducta',
  moduloDescripcion: 'Reconocer los factores sociales que multiplican el riesgo, comprender las adicciones de conducta y reflexionar sobre el rol de la comunidad.',
  leccionTitulo: 'Diapositivas · Contexto social y adicciones de conducta',
  slides: [
    {
      tipo: 'portada', numero: 5, kicker: 'Módulo 5 de 8 · Semana 5',
      titulo: 'Contexto social y adicciones de conducta',
      bajada: 'Reconocer los factores sociales que multiplican el riesgo, comprender las adicciones de conducta y reflexionar sobre el rol de la comunidad.',
      chips: ['3 horas cátedra', '120 minutos', '6 bloques'],
      notas: bajada(5),
    },
    {
      tipo: 'objetivos',
      items: [
        'Identificar los principales factores sociales que multiplican el riesgo de adicción.',
        'Comprender las adicciones de conducta: pantallas, juego y gratificación instantánea.',
        'Distinguir los paradigmas de reducción de daños y de abstinencia, y cuándo se complementan.',
        'Reflexionar sobre la respuesta de la comunidad frente al estigma: ¿juicio o compañía?',
      ],
    },
    {
      tipo: 'agenda', total: 120,
      bloques: [
        { min: 10, t: '5.1 Reconexión' },
        { min: 25, t: '5.2 Factores sociales que multiplican el riesgo' },
        { min: 25, t: '5.3 Adicciones de conducta: pantallas, juego y gratificación instantánea' },
        { min: 25, t: '5.4 Reducción de daños y abstinencia: dos paradigmas complementarios' },
        { min: 25, t: '5.5 El rol de la comunidad: entre el juicio y el acompañamiento' },
        { min: 10, t: '5.6 Cierre' },
      ],
    },
    {
      tipo: 'mapa', kicker: '5.2 · Factores sociales que multiplican el riesgo',
      titulo: 'Ninguna adicción crece en el vacío: crece en un contexto que la favorece',
      centro: 'Contexto social',
      ramas: [
        { rel: 'la favorece por la', t: 'Disponibilidad y normalización', hijos: ['De una sustancia o una conducta'] },
        { rel: 'y por la', t: 'Publicidad y cultura del consumo', hijos: ['Asocian sustancias o pantallas con éxito o pertenencia'] },
        { rel: 'y por la', t: 'Presión de grupo', hijos: ['Especialmente decisiva en la adolescencia'] },
        { rel: 'y, paradójicamente, por el', t: 'Propio estigma social', hijos: ['Aísla a quien ya sufre y le cierra caminos de ayuda'] },
      ],
      notas: nota('5.2'),
    },
    {
      tipo: 'pasos', kicker: '5.3 · Adicciones de conducta',
      titulo: 'Pantallas, juego y redes: la misma lógica neurobiológica del módulo 2',
      destacar: 3,
      pasos: [
        { t: 'Diseñadas para maximizar el uso', d: 'Redes, videojuegos y apuestas, muchas veces de manera deliberada.' },
        { t: 'Recompensa variable', d: 'La misma lógica neurobiológica que se vio para las sustancias.' },
        { t: 'Alivio inmediato', d: 'El cerebro aprende a esperarlo ante cualquier malestar.' },
        { t: 'Baja la tolerancia', d: 'A la frustración y al aburrimiento: dos capacidades centrales para el cambio.' },
      ],
      nota: 'El operador debe reconocer estos cuadros con la misma seriedad clínica que un consumo de sustancias, sobre todo en adolescentes.',
      notas: nota('5.3'),
    },
    {
      tipo: 'tarjetas', kicker: '5.4 · Dos paradigmas complementarios',
      titulo: 'Abstinencia y reducción de daños no son opuestos: en la práctica se complementan',
      tarjetas: [
        { kicker: 'Paradigma 1', titulo: 'Abstinencia', texto: 'Plantea el cese total del consumo como objetivo del tratamiento.' },
        { kicker: 'Paradigma 2', titulo: 'Reducción de daños', texto: 'Minimiza las consecuencias negativas del consumo mientras la persona no está en condiciones —o no elige, en ese momento— de dejar de consumir. Por ejemplo: evitar compartir jeringas, espaciar los consumos o sostener un vínculo de confianza que mantenga abierta la puerta de la ayuda.', oscura: true },
      ],
      notas: nota('5.4'),
    },
    {
      tipo: 'frase',
      texto: 'La reducción de daños suele ser la puerta de entrada a un proceso que puede orientarse hacia la abstinencia — y, en muchos casos, sostener a la persona con vida hasta ese momento.',
      autor: 'Módulo 5 · 5.4 Reducción de daños y abstinencia',
      notas: nota('5.4'),
    },
    {
      tipo: 'mapa', kicker: '5.5 · El rol de la comunidad',
      titulo: 'Entre el juicio y el acompañamiento: lo que multiplica las posibilidades de cambio',
      centro: 'Respuesta de la comunidad',
      ramas: [
        { rel: 'en una cultura de', t: 'Soledad estructural', hijos: ['Menos comunidad real, más conexión superficial', 'La necesidad de pertenecer se busca en una sustancia o una pantalla'] },
        { rel: 'rara vez debería ser el', t: 'Juicio', hijos: ['La persona ya está, en general, sobreexpuesta al reproche'] },
        { rel: 'lo que multiplica el cambio es el', t: 'Acompañamiento', hijos: ['Aceptación', 'Escucha atenta', 'Acercarse sin condiciones previas'] },
      ],
      notas: nota('5.5'),
    },
    {
      tipo: 'claves', titulo: 'Claves del módulo',
      items: [
        'Ninguna adicción crece en el vacío: el contexto la favorece, y el propio estigma aísla a quien ya sufre.',
        'Las pantallas, el juego y las redes usan la misma lógica de recompensa: se toman con la misma seriedad clínica.',
        'Abstinencia y reducción de daños se complementan: la segunda suele ser la puerta de entrada a la primera.',
        'Ante la adicción, la primera respuesta de una comunidad rara vez debería ser el juicio: es la aceptación y la escucha.',
      ],
    },
    {
      tipo: 'herramienta', numero: 5, nombre: 'El espejo de la comunidad',
      uso: 'Uso individual, luego en parejas · una reflexión personal, no acusatoria, sobre cómo respondemos frente a la adicción.',
      partes: [{ titulo: 'Preguntas para reflexionar', estilo: 'preguntas', items: [
        'Cuando pienso en «una persona con adicción», ¿qué palabra aparece primero en mi mente? ¿Y si esa persona fuera mi hijo, mi hermano, o yo mismo hace unos años?',
        '¿Cómo reaccionó históricamente mi comunidad (familia, institución, barrio) ante alguien con una adicción?',
        '¿Qué prejuicio propio identifico al pensar en esto?',
        'Si el primer contacto no debería ser de juicio sino de aceptación, ¿qué gesto concreto podría ofrecer esta semana?',
        '¿Dónde necesito, primero, recibir yo esa misma aceptación?',
      ] }],
      cierre: 'Una reflexión personal, no acusatoria: se trabaja primero a solas y luego en parejas.',
      notas: nota('H5'),
    },
  ],
}
