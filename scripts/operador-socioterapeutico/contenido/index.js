// Los once capítulos del libro, en el orden del índice: cada uno es un módulo de la plataforma y su
// contenido, una lección (la presentación). `orden` es el orden del módulo (0..10).
module.exports = [
  require('./00-presentacion'),
  require('./01-encuadre-etico'),
  require('./02-modulo-1'),
  require('./03-modulo-2'),
  require('./04-modulo-3'),
  require('./05-modulo-4'),
  require('./06-modulo-5'),
  require('./07-modulo-6'),
  require('./08-modulo-7'),
  require('./09-modulo-8'),
  require('./10-cierre'),
].sort((a, b) => a.orden - b.orden)
