-- Datos de ejemplo SOLO para preview local (modelo LMS). No correr en producción.
-- Los usuarios (auth.users) se crean antes vía Admin API; el trigger handle_new_user
-- ya les crea el perfil en public.alumnos. Acá seteamos rol y cargamos el curso.

-- Rol del instructor
-- Crear antes el usuario en Auth (ver README, sección "Cuentas de prueba"):
--   supabase auth admin create-user --email admin@demo.local --password ... --email-confirm
update public.alumnos set rol = 'psicologo' where email in ('psicologo@demo.local', 'admin@demo.local');
-- Links de videollamada de muestra
update public.alumnos set link_videollamada = 'https://meet.google.com/demo-juan' where email = 'juan@demo.local';
update public.alumnos set link_videollamada = 'https://meet.google.com/demo-maria' where email = 'maria@demo.local';

-- ============================================================ PROGRAMA (curso)
insert into public.programas (id, titulo, descripcion) values
  ('11111111-1111-1111-1111-111111111111', 'Formación en Psicología Aplicada a la Tarea Pastoral',
   'Programa híbrido para la detección temprana, contención inicial y derivación responsable, con herramientas basadas en evidencia (TCC, TREC, ACT).')
on conflict (id) do nothing;

-- ============================================================ MÓDULOS
insert into public.modulos (id, programa_id, titulo, descripcion, orden) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Módulo 1 · Escucha Activa y Triaje', 'Fundamentos de la escucha empática y validante.', 0),
  ('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Módulo 2 · Reestructuración Cognitiva', 'Modelo ABC de la TREC y debate de creencias.', 1)
on conflict (id) do nothing;

-- ============================================================ LECCIONES
insert into public.lecciones (id, programa_id, modulo_id, titulo, tipo_contenido, url_recurso, orden) values
  ('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   '¿Qué es la escucha activa?', 'texto_markdown',
   E'# Escucha Activa\n\nLa evidencia muestra que las personas en crisis se benefician más de una **escucha empática y validante** que de soluciones rápidas.\n\n> [!DATO]\n> La escucha activa es una habilidad central en intervención en crisis y consejería basada en evidencia.\n\n## Técnicas\n\n| Técnica | Ejemplo |\n| --- | --- |\n| Paráfrasis | "Lo que escucho es que…" |\n| Reflejo emocional | "Parece que sentís…" |\n| Resumen | "Resumiendo lo que me contaste…" |\n\n> [!ERROR]\n> Un error común es dar consejos o citar textos antes de contener.', 0),
  ('b1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   'Video: role playing de escucha', 'drive_video', 'https://drive.google.com/file/d/1SNfCAGTL1TAwZkj0MhC5hzHAcv__5ceQ/view', 1),
  ('b1111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
   'Autoevaluación: Escucha Activa', 'quiz', '', 2),
  ('b1111111-1111-1111-1111-111111111121', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111112',
   'El modelo ABC de la TREC', 'texto_markdown',
   E'# Modelo ABC\n\n- **A** (Acontecimiento): ¿qué ocurrió?\n- **B** (Creencia): ¿qué interpretación hizo la persona?\n- **C** (Consecuencia): ¿qué emociones aparecen?\n\n> [!TIP]\n> Las emociones disfuncionales suelen depender de la interpretación (B), no del hecho (A).', 0),
  ('b1111111-1111-1111-1111-111111111122', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111112',
   'Trabajo Final Integrador', 'entrega',
   E'# Trabajo Final Integrador\n\nDiseñá un **Protocolo de Contención Pastoral** para tu comunidad. Subí el documento (PDF) con: diagnóstico, protocolo de escucha, sistema de triaje (semáforo) y red de derivación.', 1)
on conflict (id) do nothing;

-- ============================================================ QUIZ
insert into public.quiz_preguntas (leccion_id, pregunta, opciones, respuesta_correcta, orden) values
  ('b1111111-1111-1111-1111-111111111113', '¿Cuál es el objetivo principal de la escucha activa?',
   '["Dar consejos rápidos","Contener y comprender al otro","Citar textos de memoria"]'::jsonb, 'Contener y comprender al otro', 0),
  ('b1111111-1111-1111-1111-111111111113', 'Ante una persona en crisis, ¿qué conviene evitar?',
   '["Reflejar la emoción","Minimizar el dolor","Resumir lo escuchado"]'::jsonb, 'Minimizar el dolor', 1),
  ('b1111111-1111-1111-1111-111111111113', 'La paráfrasis sirve para…',
   '["Demostrar que uno sabe más","Devolver con otras palabras lo que dijo la persona","Cambiar de tema"]'::jsonb, 'Devolver con otras palabras lo que dijo la persona', 2)
on conflict do nothing;

-- ============================================================ COHORTE + inscripción
insert into public.cohortes (id, programa_id, nombre, fecha_inicio, fecha_fin) values
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Comisión 2026-A', current_date, current_date + 56)
on conflict (id) do nothing;

insert into public.cohortes_alumnos (cohorte_id, alumno_id)
select 'c0000000-0000-0000-0000-000000000001'::uuid, id from public.alumnos where email in ('juan@demo.local','maria@demo.local')
on conflict do nothing;

-- Acceso al programa (lo que normalmente hace inscribirAlumnosEnCohorte)
insert into public.programas_asignados (alumno_id, programa_id)
select id, '11111111-1111-1111-1111-111111111111'::uuid from public.alumnos where email in ('juan@demo.local','maria@demo.local')
on conflict do nothing;

-- ============================================================ BIBLIOTECA
insert into public.biblioteca_recursos (id, titulo, tipo_contenido, url_recurso) values
  ('d1111111-1111-1111-1111-111111111111', 'Ficha: Registro ABC (PDF)', 'drive_pdf', 'https://drive.google.com/file/d/1SNfCAGTL1TAwZkj0MhC5hzHAcv__5ceQ/view')
on conflict (id) do nothing;

insert into public.recursos_asignados (alumno_id, recurso_id)
select id, 'd1111111-1111-1111-1111-111111111111'::uuid from public.alumnos where email in ('juan@demo.local','maria@demo.local')
on conflict do nothing;

-- ============================================================ AGENDA
-- Sesión grupal presencial de la cohorte (sábado, estilo "Dignos")
insert into public.agenda_sesiones (cohorte_id, fecha_hora, tipo, lugar)
values ('c0000000-0000-0000-0000-000000000001'::uuid, date_trunc('day', now()) + interval '3 days' + interval '8 hours', 'presencial', 'Dignos, Quilmes');

-- Sesión individual virtual de Juan
insert into public.agenda_sesiones (alumno_id, fecha_hora, tipo, enlace)
select id, date_trunc('day', now()) + interval '5 days' + interval '18 hours', 'virtual', 'https://meet.google.com/demo-juan'
from public.alumnos where email = 'juan@demo.local';
