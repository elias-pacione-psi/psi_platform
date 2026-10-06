const { nota, bajada } = require('./notas')

module.exports = {
  orden: 8,
  archivo: '08-modulo-7-el-rol-del-operador-socioterapeutico',
  etiqueta: 'Módulo 7 · El rol del operador socioterapéutico',
  moduloTitulo: 'Módulo 7 · El rol del operador socioterapéutico',
  moduloDescripcion: 'Definir el perfil, las competencias, los límites éticos y las herramientas de autocuidado propias de quien acompaña procesos de recuperación.',
  leccionTitulo: 'Diapositivas · El rol del operador socioterapéutico',
  slides: [
    {
      tipo: 'portada', numero: 7, kicker: 'Módulo 7 de 8 · Semana 7',
      titulo: 'El rol del operador socioterapéutico',
      bajada: 'Definir el perfil, las competencias, los límites éticos y las herramientas de autocuidado propias de quien acompaña procesos de recuperación.',
      chips: ['3 horas cátedra', '120 minutos', '6 bloques'],
      notas: bajada(7),
    },
    {
      tipo: 'objetivos',
      items: [
        'Definir el perfil y las competencias centrales del operador socioterapéutico.',
        'Incorporar herramientas básicas de primeros auxilios psicológicos y manejo de crisis.',
        'Establecer con claridad los límites profesionales, la confidencialidad y la ética del acompañamiento.',
        'Reconocer el desgaste por empatía y desarrollar un plan personal de autocuidado.',
      ],
    },
    {
      tipo: 'agenda', total: 120,
      bloques: [
        { min: 10, t: '7.1 Reconexión' },
        { min: 20, t: '7.2 Perfil y competencias del operador socioterapéutico' },
        { min: 30, t: '7.3 Primeros auxilios psicológicos y manejo de crisis' },
        { min: 25, t: '7.4 Límites profesionales, confidencialidad y ética del acompañamiento' },
        { min: 25, t: '7.5 Desgaste por empatía y autocuidado del operador' },
        { min: 10, t: '7.6 Cierre' },
      ],
    },
    {
      tipo: 'comparacion', kicker: '7.2 · Perfil y competencias',
      titulo: 'Quien sostiene el acompañamiento cotidiano, siempre articulado con un equipo profesional',
      izq: { titulo: 'Lo que hace', tono: 'sage', items: ['Escucha y contiene', 'Informa y motiva', 'Identifica señales de alarma', 'Sostiene el vínculo entre la persona, su familia y la red de tratamiento'] },
      der: { titulo: 'Lo que no hace', tono: 'ladrillo', items: ['No diagnostica', 'No medica', 'No reemplaza una psicoterapia'] },
      notas: nota('7.2'),
    },
    {
      tipo: 'mapa', kicker: '7.2 · Un perfil de rol con límites explícitos',
      titulo: 'Las competencias de los módulos anteriores se integran en el perfil del operador',
      centro: 'Perfil del operador socioterapéutico',
      ramas: [
        { rel: 'integra la', t: 'Comprensión biopsicosocial de la adicción', hijos: ['Módulos 1 y 2'] },
        { rel: 'integra el', t: 'Manejo básico de la entrevista motivacional', hijos: ['Módulo 3'] },
        { rel: 'integra la', t: 'Lectura del sistema familiar', hijos: ['Módulo 4'] },
        { rel: 'integra el', t: 'Conocimiento de la red de derivación', hijos: ['Módulo 6'] },
      ],
      notas: nota('7.2'),
    },
    {
      tipo: 'pasos', kicker: '7.3 · Primeros auxilios psicológicos',
      titulo: 'Primeros auxilios psicológicos: cinco principios para contener',
      max: 18,
      pasos: [
        { t: 'Proteger', d: 'Garantizar la seguridad física, propia y de la persona, antes que cualquier otra cosa.' },
        { t: 'Conectar', d: 'Presentarse con calma, sin apuro, sin invadir el espacio físico.' },
        { t: 'Escuchar', d: 'Sin presionar a hablar de lo que no se quiere compartir.' },
        { t: 'Nombrar la emoción', d: 'No el hecho: «te noto muy angustiado», en lugar de sermonear sobre lo ocurrido.' },
        { t: 'Conectar con la red', d: 'Familiar de confianza, profesional tratante o servicio de emergencias, según la gravedad.' },
      ],
      nota: 'Frente a una persona intoxicada o en una crisis intensa, el objetivo no es razonar ni sermonear, sino contener.',
      notas: nota('7.3'),
    },
    {
      tipo: 'tarjetas', kicker: '7.3 · Intoxicación aguda o crisis emocional intensa',
      titulo: 'En ese momento el cerebro no puede procesar explicaciones largas',
      tarjetas: [
        { kicker: 'Qué se observa', titulo: 'Inquietud o somnolencia', texto: 'Suele estar inquieta, nerviosa, con la mirada rígida o, en el otro extremo, somnolienta.' },
        { kicker: 'Qué no sirve', titulo: 'Razonar o sermonear', texto: 'Las explicaciones largas no se procesan en ese estado.' },
        { kicker: 'Qué sí', titulo: 'Indicaciones breves, firmes y cálidas', texto: '«Ahora vamos a hacer esto», «vení, sentate acá»: sin perder el control de la situación ni exponerse a un riesgo físico.', oscura: true },
      ],
      notas: nota('7.3'),
    },
    {
      tipo: 'lista', kicker: '7.3 · Ideación suicida',
      titulo: 'Ante ideación suicida, nunca se gestiona en soledad',
      max: 21,
      items: [
        { t: 'Acompañar y no dejar sola a la persona', d: '', acento: 'b3372f' },
        { t: 'Activar de inmediato la derivación', d: 'A un servicio de salud mental o a una línea de emergencia.', acento: 'b3372f' },
        { t: 'Preguntar directamente si está pensando en hacerse daño', d: 'No aumenta el riesgo: es una de las intervenciones que la evidencia recomienda con mayor firmeza.', acento: 'b3372f' },
      ],
      notas: nota('7.3'),
    },
    {
      tipo: 'mapa', kicker: '7.4 · Límites profesionales y ética del acompañamiento',
      titulo: 'Dos límites centrales: la confidencialidad y los vínculos duales',
      centro: 'Límites del acompañamiento',
      ramas: [
        { rel: 'la confidencialidad', t: 'Sostiene la confianza, pero no es absoluta', hijos: ['Con riesgo de vida —propio o de terceros— se rompe y se activa la red', 'Se comunica a la persona siempre que sea posible', 'Se explicita desde el primer encuentro'] },
        { rel: 'los vínculos duales', t: 'Evitar mezclar el rol', hijos: ['Con relaciones económicas, afectivas o de dependencia personal', 'No es frialdad: permite sostener la ayuda en el tiempo', 'Previene la sobreidentificación del módulo 1'] },
      ],
      notas: nota('7.4'),
    },
    {
      tipo: 'mapa', kicker: '7.5 · Desgaste por empatía y autocuidado',
      titulo: 'El desgaste por empatía es un riesgo laboral del rol, no una debilidad',
      centro: 'Desgaste por empatía (fatiga por compasión)',
      ramas: [
        { rel: 'es', t: 'Un riesgo laboral del rol', hijos: ['No es debilidad ni falta de vocación', 'Se previene y se trata como cualquier otro'] },
        { rel: 'combina', t: 'Cansancio del cuidado y sufrimiento ajeno', hijos: ['Por el contacto frecuente con el dolor de otros'] },
        { rel: 'se sostiene con', t: 'Tres estrategias', hijos: ['Supervisión periódica', 'Terapia propia o grupos de pares', 'Protocolo personal de alerta temprana'] },
      ],
      notas: nota('7.5'),
    },
    {
      tipo: 'frase',
      texto: 'Cuidarte a vos mismo como operador no es egoísmo. Es la única forma de sostener, con calidad, el acompañamiento a largo plazo.',
      autor: 'Módulo 7 · Protocolo de alerta temprana del operador',
      notas: nota('H7'),
    },
    {
      tipo: 'claves', titulo: 'Claves del módulo',
      items: [
        'El operador acompaña, contiene, informa y motiva; no diagnostica, no medica ni reemplaza una psicoterapia.',
        'Primeros auxilios psicológicos: proteger, conectar, escuchar, nombrar la emoción y conectar con la red.',
        'Ante ideación suicida: acompañar, no dejar sola a la persona y derivar de inmediato. Preguntar no aumenta el riesgo.',
        'La confidencialidad no es absoluta, y los vínculos duales se evitan desde el primer encuentro.',
        'El desgaste por empatía es un riesgo del rol: supervisión, espacios propios y un protocolo de alerta.',
      ],
    },
    {
      tipo: 'herramienta', numero: 7, nombre: 'Protocolo de alerta temprana del operador',
      uso: 'Uso personal y periódico · para revisar el propio estado antes de que el desgaste comprometa la calidad del acompañamiento.',
      max: 16,
      partes: [
        { titulo: 'Señales de alarma en mí mismo', estilo: 'checks', items: [
          'Me cuesta desconectar de los casos fuera del horario de trabajo',
          'Noto irritabilidad, cinismo o desesperanza creciente frente a los casos',
          'Empecé a saltear mis espacios de descanso, supervisión o cuidado personal',
          'Siento que «solo yo puedo ayudar» a alguna persona en particular',
          'Estoy cruzando, o tentado a cruzar, algún límite del rol',
        ] },
        { titulo: 'Mi plan de sostén', estilo: 'campos', items: [
          'Espacio de supervisión o terapia propia: ¿con qué frecuencia?',
          'Persona o grupo de pares con quien hablar de un caso que me pesa',
          'Una actividad personal, ajena a este rol, que sostengo cada semana',
          'Mi propia señal de alerta temprana (la primera que suelo ignorar)',
        ] },
      ],
      notas: nota('H7'),
    },
  ],
}
