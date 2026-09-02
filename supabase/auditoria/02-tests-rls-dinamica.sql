-- ============================================================================
-- TESTS DINÁMICOS DE RLS — Plataforma de Cursos (Psicología)
-- Correr en el SQL Editor del proyecto:
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- 01-auditoria-estatica.sql lee el catálogo y dice "la policy está escrita".
-- Este archivo hace lo otro: SE HACE PASAR POR UN ALUMNO y prueba qué puede
-- leer y escribir de verdad. Una policy puede estar perfectamente redactada y
-- aun así dejar pasar algo, porque lo que decide no es el texto sino cómo se
-- combina con las otras (las policies son OR entre sí) y con los GRANT.
--
-- ¿ES SEGURO CORRERLO EN PRODUCCIÓN? Sí, y no depende de que te acuerdes de
-- hacer rollback. Todo pasa dentro de una subtransacción que termina SIEMPRE
-- con un `raise exception` deliberado: los alumnos, programas y entregas de
-- prueba se crean, se usan y se deshacen antes de que la función devuelva la
-- primera fila. Las variables de PL/pgSQL sobreviven a ese rollback (viven en
-- memoria, no en la transacción) y por eso los resultados llegan igual.
-- Después de correrlo, `select count(*) from auth.users` da lo mismo que antes.
--
-- Los datos de prueba usan el dominio @auditoria.invalid — `.invalid` está
-- reservado por RFC 2606 y no puede existir, así que ni por accidente le llega
-- un mail a nadie.
--
-- CÓMO LEERLO: la columna `veredicto` es lo único que importa.
--   PASA   el candado aguantó
--   FALLA  el candado no está donde se lo esperaba — leer `esperado` vs `obtenido`
--   NOTA   comportamiento real que conviene mirar, no necesariamente un bug
--
-- En `obtenido`, un conteo de -1 significa "la consulta ni siquiera fue
-- permitida" (falta el GRANT, PostgREST devolvería 401), distinto de 0, que es
-- "la consulta corrió y la RLS no dejó pasar ninguna fila" (PostgREST devuelve
-- una lista vacía). Los dos son cerrado; el primero cierra una puerta antes.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- Herramientas. Viven en pg_temp: se borran solas al cerrar la sesión del
-- editor, no quedan en el schema del proyecto.
-- ----------------------------------------------------------------------------

-- Se hace pasar por alguien. uid null = visitante sin sesión (rol anon).
create or replace function pg_temp.persona(uid uuid) returns void
language plpgsql as $$
begin
  if uid is null then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    perform set_config('request.jwt.claim.sub', '', true);
    perform set_config('role', 'anon', true);
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid::text, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', uid::text, true);
    perform set_config('role', 'authenticated', true);
  end if;
end $$;

-- Cuenta cuántas filas ve esa persona. -1 = ni siquiera pudo consultar.
create or replace function pg_temp.ve(uid uuid, consulta text) returns int
language plpgsql as $$
declare n int;
begin
  perform pg_temp.persona(uid);
  begin
    execute 'select count(*) from (' || consulta || ') t' into n;
  exception when others then
    n := -1;
  end;
  perform set_config('role', 'none', true);
  return n;
end $$;

-- Intenta escribir como esa persona. Devuelve qué pasó, en castellano.
create or replace function pg_temp.escribe(uid uuid, sentencia text) returns text
language plpgsql as $$
declare n int; resultado text;
begin
  perform pg_temp.persona(uid);
  begin
    execute sentencia;
    get diagnostics n = row_count;
    resultado := case when n = 0 then 'sin efecto (0 filas)' else 'ESCRIBIÓ ' || n || ' fila(s)' end;
  exception
    when insufficient_privilege then resultado := 'bloqueado por permisos (42501)';
    when others then resultado := 'bloqueado (' || sqlstate || ')';
  end;
  perform set_config('role', 'none', true);
  return resultado;
end $$;

-- Lee un solo valor como esa persona (para verificar qué quedó guardado).
create or replace function pg_temp.valor(uid uuid, consulta text) returns text
language plpgsql as $$
declare v text;
begin
  perform pg_temp.persona(uid);
  begin
    execute consulta into v;
  exception when others then
    v := '<error ' || sqlstate || '>';
  end;
  perform set_config('role', 'none', true);
  return coalesce(v, '<null>');
end $$;

create or replace function pg_temp.anotar(
  res jsonb, grupo text, prueba text, esperado text, obtenido text, ok boolean, nota boolean default false
) returns jsonb
language sql immutable as $$
  select res || jsonb_build_array(jsonb_build_object(
    'i', jsonb_array_length(res),
    'veredicto', case when nota then 'NOTA' when ok then 'PASA' else 'FALLA' end,
    'grupo', grupo, 'prueba', prueba, 'esperado', esperado, 'obtenido', obtenido))
$$;


-- ----------------------------------------------------------------------------
-- La batería.
-- ----------------------------------------------------------------------------

create or replace function pg_temp.tests_rls()
returns table (veredicto text, grupo text, prueba text, esperado text, obtenido text)
language plpgsql as $fn$
declare
  -- Personas
  alu_a  uuid := 'aaaa0000-0000-4000-8000-0000000000a1';  -- alumno bajo prueba
  alu_b  uuid := 'bbbb0000-0000-4000-8000-0000000000b2';  -- compañero (sus datos son el objetivo)
  psi    uuid := 'cccc0000-0000-4000-8000-0000000000c3';  -- psicólogo
  -- Contenido
  prog_ok    uuid := 'd0d00000-0000-4000-8000-0000000000d1';  -- asignado a A
  prog_ajeno uuid := 'd0d00000-0000-4000-8000-0000000000d2';  -- de B, y no publicado en home
  mod_ok     uuid := 'e0e00000-0000-4000-8000-0000000000e1';
  mod_ajeno  uuid := 'e0e00000-0000-4000-8000-0000000000e2';
  lec_ok     uuid := 'f0f00000-0000-4000-8000-0000000000f1';  -- video, programa asignado
  lec_quiz   uuid := 'f0f00000-0000-4000-8000-0000000000f2';  -- quiz, programa asignado
  lec_entr   uuid := 'f0f00000-0000-4000-8000-0000000000f3';  -- entrega, programa asignado
  lec_ajena  uuid := 'f0f00000-0000-4000-8000-0000000000f4';  -- del programa ajeno
  -- Organización
  coh_a      uuid := '10100000-0000-4000-8000-000000000011';
  coh_ajena  uuid := '10100000-0000-4000-8000-000000000012';
  rec_ok     uuid := '20200000-0000-4000-8000-000000000021';
  rec_ajeno  uuid := '20200000-0000-4000-8000-000000000022';
  ebook_id   uuid := '30300000-0000-4000-8000-000000000031';
  entrega_b  uuid := '40400000-0000-4000-8000-000000000041';
  entrega_a  uuid;

  res jsonb := '[]'::jsonb;
  n int; txt text;
begin
  begin  -- ======== todo lo de acá adentro se deshace al final, siempre ========

  -- -------------------------------------------------------------------------
  -- FIXTURES (creadas como postgres, igual que createAdminClient() en la app)
  -- -------------------------------------------------------------------------
  insert into auth.users (id, email, raw_user_meta_data) values
    (alu_a, 'alumno-a@auditoria.invalid', '{"nombre":"Alumno A de prueba"}'::jsonb),
    (alu_b, 'alumno-b@auditoria.invalid', '{"nombre":"Alumno B de prueba"}'::jsonb),
    (psi,   'psicologo@auditoria.invalid', '{"nombre":"Psicologo de prueba"}'::jsonb);

  -- El trigger on_auth_user_created ya creó los perfiles; se completan acá.
  insert into public.alumnos (id, email, nombre) values
    (alu_a, 'alumno-a@auditoria.invalid', 'Alumno A de prueba'),
    (alu_b, 'alumno-b@auditoria.invalid', 'Alumno B de prueba'),
    (psi,   'psicologo@auditoria.invalid', 'Psicologo de prueba')
  on conflict (id) do nothing;
  update public.alumnos set rol = 'psicologo' where id = psi;
  update public.alumnos set telefono = '+54 11 0000-0000', link_videollamada = 'https://meet.example/b'
    where id = alu_b;

  -- El resto de las fixtures se crea con las credenciales del psicólogo de prueba en
  -- los claims (sin cambiar de rol: seguimos siendo postgres, o sea que la RLS no
  -- estorba). Hace falta por el trigger proteger_entrega_de_alumno: si auth.uid() es
  -- null, es_psicologo() da false y el trigger pisa alumno_id con null — la entrega de
  -- B no se podría sembrar. Es también la razón por la que la app nunca crea entregas
  -- con service-role: ese camino no funciona, y es correcto que no funcione.
  perform set_config('request.jwt.claims',
    json_build_object('sub', psi::text, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', psi::text, true);

  insert into public.programas (id, titulo, publicado_en_home) values
    (prog_ok,    'Curso asignado (auditoría)', false),
    (prog_ajeno, 'Curso ajeno (auditoría)',    false);

  insert into public.modulos (id, programa_id, titulo) values
    (mod_ok, prog_ok, 'Módulo asignado'),
    (mod_ajeno, prog_ajeno, 'Módulo ajeno');

  insert into public.lecciones (id, programa_id, modulo_id, titulo, tipo_contenido, url_recurso) values
    (lec_ok,    prog_ok,    mod_ok,    'Lección asignada', 'drive_video', 'https://drive.google.com/file/d/x/view'),
    (lec_quiz,  prog_ok,    mod_ok,    'Quiz de prueba',   'quiz',        ''),
    (lec_entr,  prog_ok,    mod_ok,    'Entrega de prueba','entrega',     ''),
    (lec_ajena, prog_ajeno, mod_ajeno, 'Lección ajena',    'drive_video', 'https://drive.google.com/file/d/y/view');

  insert into public.quiz_preguntas (leccion_id, pregunta, opciones, respuesta_correcta) values
    (lec_quiz, '¿Cuál es la respuesta?', '["correcta","incorrecta"]'::jsonb, 'correcta');

  insert into public.programas_asignados (alumno_id, programa_id) values
    (alu_a, prog_ok), (alu_b, prog_ok), (alu_b, prog_ajeno);

  insert into public.cohortes (id, nombre) values
    (coh_a, 'Cohorte de A (auditoría)'), (coh_ajena, 'Cohorte ajena (auditoría)');
  insert into public.cohortes_alumnos (cohorte_id, alumno_id) values
    (coh_a, alu_a), (coh_ajena, alu_b);
  insert into public.cohortes_programas (cohorte_id, programa_id) values
    (coh_a, prog_ok), (coh_ajena, prog_ajeno);

  insert into public.biblioteca_recursos (id, titulo, tipo_contenido, url_recurso) values
    (rec_ok,    'Libro asignado', 'drive_pdf', 'https://drive.google.com/file/d/lib1/view'),
    (rec_ajeno, 'Libro ajeno',    'drive_pdf', 'https://drive.google.com/file/d/lib2/view');
  insert into public.recursos_asignados (alumno_id, recurso_id) values (alu_a, rec_ok), (alu_b, rec_ajeno);

  -- Datos de B: son el objetivo de todas las pruebas de aislamiento.
  insert into public.entregas (id, leccion_id, alumno_id, archivo_url, comentario_alumno, estado, comentario_instructor)
    values (entrega_b, lec_entr, alu_b, 'r2key://entregas/' || alu_b::text || '/tp-de-b.pdf',
            'Mi trabajo', 'revisada', 'Devolución escrita por el instructor');
  insert into public.quiz_intentos (alumno_id, leccion_id, puntaje, total, aprobado)
    values (alu_b, lec_quiz, 1, 1, true);
  insert into public.progreso_lecciones (alumno_id, leccion_id) values (alu_b, lec_ok);
  insert into public.opiniones_curso (programa_id, alumno_id, puntuacion, lo_que_sirvio)
    values (prog_ok, alu_b, 5, 'Opinión privada de B');
  insert into public.agenda_sesiones (alumno_id, fecha_hora, enlace) values
    (alu_a, now() + interval '1 day', 'https://meet.example/a'),
    (alu_b, now() + interval '2 day', 'https://meet.example/b');
  insert into public.agenda_sesiones (cohorte_id, fecha_hora, tipo, lugar) values
    (coh_a, now() + interval '3 day', 'presencial', 'Aula de A'),
    (coh_ajena, now() + interval '4 day', 'presencial', 'Aula ajena');

  insert into public.ebooks (id, slug, titulo, archivo_key, precio_centavos, estado) values
    (ebook_id, 'ebook-auditoria', 'Ebook de prueba', 'r2key://Libros/secreto-pago.pdf', 500000, 'publicado');
  insert into public.ordenes (ebook_id, email_comprador, alumno_id, precio_cobrado, estado, token_descarga, pagada_at)
    values (ebook_id, 'alumno-b@auditoria.invalid', alu_b, 500000, 'pagada', 'token-secreto-de-b', now());

  insert into public.solicitudes_registro (nombre, email, telefono, objetivos)
    values ('Consultante de prueba', 'consulta@auditoria.invalid', '+54 11 1111-1111',
            'Texto sensible pre-alta que no puede salir por la Data API');
  insert into public.emails_enviados (tipo, alumno_id, destinatario_email, estado)
    values ('recordatorio_clase', alu_b, 'alumno-b@auditoria.invalid', 'enviado');


  -- =========================================================================
  -- M · META — que la prueba sea válida. Si esto falla, todo lo de abajo pasa
  -- por el motivo equivocado (nadie está impersonando a nadie).
  -- =========================================================================
  txt := pg_temp.valor(alu_a, 'select current_user::text');
  res := pg_temp.anotar(res, 'M · Meta', 'La sesión de prueba corre como authenticated, no como postgres',
         'authenticated', txt, txt = 'authenticated');

  txt := pg_temp.valor(alu_a, 'select auth.uid()::text');
  res := pg_temp.anotar(res, 'M · Meta', 'auth.uid() devuelve el alumno impersonado',
         alu_a::text, txt, txt = alu_a::text);

  n := pg_temp.ve(alu_a, 'select 1 from public.alumnos');
  res := pg_temp.anotar(res, 'M · Meta', 'La RLS está filtrando (A ve 1 perfil, no la tabla entera)',
         '1 fila(s)', n || ' fila(s)', n = 1);


  -- =========================================================================
  -- I · AISLAMIENTO ENTRE ALUMNOS — lo de B no se ve desde A
  -- =========================================================================
  n := pg_temp.ve(alu_a, format('select 1 from public.alumnos where id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve el perfil (mail, teléfono, link de videollamada) de otro alumno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.entregas where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve las entregas de otro alumno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.quiz_intentos where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve los intentos de quiz de otro alumno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.progreso_lecciones where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve el progreso de otro alumno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.opiniones_curso where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no lee la opinión de curso de otro alumno (no es un foro)',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.ordenes where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve las órdenes de compra de otro alumno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.agenda_sesiones where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve las sesiones individuales de otro alumno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.agenda_sesiones where cohorte_id = %L', coh_ajena));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no ve las clases de una cohorte a la que no pertenece',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.agenda_sesiones where cohorte_id = %L', coh_a));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A SÍ ve las clases de su propia cohorte',
         '1 fila(s)', n || ' fila(s)', n = 1);

  n := pg_temp.ve(alu_a, format('select 1 from public.cohortes_alumnos where cohorte_id = %L', coh_ajena));
  res := pg_temp.anotar(res, 'I · Aislamiento', 'A no puede listar quiénes cursan en otra cohorte',
         '0 fila(s)', n || ' fila(s)', n = 0);


  -- =========================================================================
  -- C · CONTENIDO — solo lo asignado
  -- =========================================================================
  n := pg_temp.ve(alu_a, format('select 1 from public.programas where id = %L', prog_ajeno));
  res := pg_temp.anotar(res, 'C · Contenido', 'A no ve un curso que no tiene asignado',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.modulos where programa_id = %L', prog_ajeno));
  res := pg_temp.anotar(res, 'C · Contenido', 'A no ve los módulos de un curso ajeno',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.lecciones where programa_id = %L', prog_ajeno));
  res := pg_temp.anotar(res, 'C · Contenido', 'A no ve las lecciones de un curso ajeno (ni su url_recurso)',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.lecciones where programa_id = %L', prog_ok));
  res := pg_temp.anotar(res, 'C · Contenido', 'A SÍ ve las lecciones del curso que le asignaron',
         '3 fila(s)', n || ' fila(s)', n = 3);

  n := pg_temp.ve(alu_a, format('select 1 from public.biblioteca_recursos where id = %L', rec_ajeno));
  res := pg_temp.anotar(res, 'C · Contenido', 'A no ve un libro de la biblioteca que no le asignaron',
         '0 fila(s)', n || ' fila(s)', n = 0);

  n := pg_temp.ve(alu_a, format('select 1 from public.biblioteca_recursos where id = %L', rec_ok));
  res := pg_temp.anotar(res, 'C · Contenido', 'A SÍ ve el libro que le asignaron',
         '1 fila(s)', n || ' fila(s)', n = 1);


  -- =========================================================================
  -- Q · QUIZ — la respuesta correcta no puede salir de la base
  -- =========================================================================
  n := pg_temp.ve(alu_a, 'select 1 from public.quiz_preguntas');
  res := pg_temp.anotar(res, 'Q · Quiz', 'A NO puede leer quiz_preguntas (ahí vive respuesta_correcta)',
         '0 fila(s)', n || ' fila(s)', n = 0);

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.quiz_intentos (alumno_id, leccion_id, puntaje, total, aprobado) values (%L, %L, 10, 10, true)',
    alu_a, lec_quiz));
  res := pg_temp.anotar(res, 'Q · Quiz', 'A no puede inventarse un intento aprobado escribiendo directo en la tabla',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'select public.registrar_intento_quiz(%L, %L, 10, 10, true)', alu_a, lec_quiz));
  res := pg_temp.anotar(res, 'Q · Quiz', 'A no puede llamar a registrar_intento_quiz por /rest/v1/rpc',
         'bloqueado por permisos', txt, txt like 'bloqueado%');

  txt := pg_temp.escribe(alu_a, format(
    'update public.quiz_intentos set aprobado = true, puntaje = 10 where alumno_id = %L', alu_a));
  res := pg_temp.anotar(res, 'Q · Quiz', 'A no puede editar sus intentos para aprobarse después',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');


  -- =========================================================================
  -- E · ENTREGAS — dueño, archivo y campos del instructor
  -- =========================================================================
  txt := pg_temp.escribe(alu_a, format(
    'insert into public.entregas (leccion_id, alumno_id, archivo_url) values (%L, %L, %L)',
    lec_entr, alu_a, 'r2key://entregas/' || alu_b::text || '/tp-de-b.pdf'));
  res := pg_temp.anotar(res, 'E · Entregas', 'A no puede registrar como propio el archivo de otro alumno',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.entregas (leccion_id, alumno_id, archivo_url) values (%L, %L, %L)',
    lec_ajena, alu_a, 'r2key://entregas/' || alu_a::text || '/tp.pdf'));
  res := pg_temp.anotar(res, 'E · Entregas', 'A no puede entregar en una lección de un curso que no cursa',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  -- Entrega legítima, pero mintiendo en los campos del instructor.
  txt := pg_temp.escribe(alu_a, format(
    'insert into public.entregas (leccion_id, alumno_id, archivo_url, estado, comentario_instructor) values (%L, %L, %L, %L, %L)',
    lec_entr, alu_a, 'r2key://entregas/' || alu_a::text || '/tp.pdf', 'revisada', 'Excelente, aprobado (lo escribí yo)'));
  res := pg_temp.anotar(res, 'E · Entregas', 'A SÍ puede entregar en su propia lección asignada',
         'escribió 1 fila', txt, txt like 'ESCRIBIÓ%');

  select id into entrega_a from public.entregas where alumno_id = alu_a and leccion_id = lec_entr;

  txt := pg_temp.valor(alu_a, format('select estado from public.entregas where id = %L', entrega_a));
  res := pg_temp.anotar(res, 'E · Entregas', 'Una entrega nunca nace "revisada" aunque el alumno lo mande en el body',
         'entregada', txt, txt = 'entregada');

  txt := pg_temp.valor(alu_a, format('select coalesce(comentario_instructor, ''<null>'') from public.entregas where id = %L', entrega_a));
  res := pg_temp.anotar(res, 'E · Entregas', 'El alumno no puede escribirse a sí mismo la devolución del instructor',
         '<null>', txt, txt = '<null>');

  txt := pg_temp.escribe(alu_a, format(
    'update public.entregas set estado = ''revisada'', comentario_instructor = ''Me apruebo solo'' where id = %L', entrega_a));
  txt := pg_temp.valor(alu_a, format('select estado || '' / '' || coalesce(comentario_instructor, ''<null>'') from public.entregas where id = %L', entrega_a));
  res := pg_temp.anotar(res, 'E · Entregas', 'A no puede auto-revisarse editando su entrega después',
         'entregada / <null>', txt, txt = 'entregada / <null>');

  txt := pg_temp.escribe(alu_a, format(
    'update public.entregas set alumno_id = %L where id = %L', alu_b, entrega_a));
  txt := pg_temp.valor(alu_a, format('select alumno_id::text from public.entregas where id = %L', entrega_a));
  res := pg_temp.anotar(res, 'E · Entregas', 'A no puede transferirle la autoría de su entrega a otro alumno',
         alu_a::text, txt, txt = alu_a::text);

  txt := pg_temp.escribe(alu_a, format(
    'update public.entregas set comentario_alumno = ''editado'' where id = %L', entrega_b));
  res := pg_temp.anotar(res, 'E · Entregas', 'A no puede editar la entrega de otro alumno',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');


  -- =========================================================================
  -- P · ESCALADA DE PRIVILEGIOS — el alumno no puede darse nada a sí mismo
  -- =========================================================================
  txt := pg_temp.escribe(alu_a, format(
    'update public.alumnos set rol = ''psicologo'' where id = %L', alu_a));
  txt := pg_temp.valor(alu_a, format('select rol from public.alumnos where id = %L', alu_a));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede convertirse en psicólogo (el rol vive en alumnos.rol)',
         'alumno', txt, txt = 'alumno');

  txt := pg_temp.escribe(alu_a, format(
    'update public.alumnos set estado = ''activo'' where id = %L', alu_b));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede tocar el estado (activo/suspendido) de otra cuenta',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.programas_asignados (alumno_id, programa_id) values (%L, %L)', alu_a, prog_ajeno));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede auto-asignarse un curso que no le dieron',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.cohortes_alumnos (cohorte_id, alumno_id) values (%L, %L)', coh_ajena, alu_a));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede meterse en una cohorte ajena',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.recursos_asignados (alumno_id, recurso_id) values (%L, %L)', alu_a, rec_ajeno));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede auto-asignarse un libro de la biblioteca',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, 'insert into public.programas (titulo) values (''Curso creado por un alumno'')');
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede crear cursos',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'update public.lecciones set titulo = ''Modificada por un alumno'' where id = %L', lec_ok));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede editar el material del curso',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format('delete from public.lecciones where id = %L', lec_ok));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede borrar lecciones',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.agenda_sesiones (alumno_id, fecha_hora) values (%L, now())', alu_a));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede agendarse sesiones por su cuenta',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.progreso_lecciones (alumno_id, leccion_id) values (%L, %L)', alu_a, lec_ajena));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede marcar progreso en una lección de un curso ajeno',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.progreso_lecciones (alumno_id, leccion_id) values (%L, %L)', alu_a, lec_ok));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A SÍ puede marcar como vista una lección de su curso',
         'escribió 1 fila', txt, txt like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.progreso_lecciones (alumno_id, leccion_id) values (%L, %L)', alu_b, lec_ok));
  res := pg_temp.anotar(res, 'P · Privilegios', 'A no puede marcar progreso en nombre de otro alumno',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');


  -- =========================================================================
  -- S · DATOS SENSIBLES — lo que solo puede tocar el servidor
  -- =========================================================================
  n := pg_temp.ve(alu_a, 'select 1 from public.solicitudes_registro');
  res := pg_temp.anotar(res, 'S · Sensibles', 'A no ve las consultas del formulario público (motivo de consulta pre-alta)',
         '0 fila(s) o sin permiso', n || ' fila(s)', n <= 0);

  n := pg_temp.ve(alu_a, 'select 1 from public.emails_enviados');
  res := pg_temp.anotar(res, 'S · Sensibles', 'A no ve el registro de mails enviados a otras personas',
         '0 fila(s) o sin permiso', n || ' fila(s)', n <= 0);

  txt := pg_temp.valor(alu_a, format('select archivo_key from public.ebooks where id = %L', ebook_id));
  res := pg_temp.anotar(res, 'S · Sensibles', 'ebooks.archivo_key: qué ve del ebook pago un alumno que no lo compró',
         'idealmente <null>', txt, txt = '<null>',
         nota := (txt <> '<null>'));

  n := pg_temp.ve(alu_a, 'select 1 from public.ordenes where token_descarga is not null');
  res := pg_temp.anotar(res, 'S · Sensibles', 'A no ve tokens de descarga de compras ajenas',
         '0 fila(s)', n || ' fila(s)', n = 0);


  -- =========================================================================
  -- O · OPINIONES — son del alumno y de nadie más
  -- =========================================================================
  txt := pg_temp.escribe(alu_a, format(
    'insert into public.opiniones_curso (programa_id, alumno_id, puntuacion) values (%L, %L, 4)', prog_ok, alu_a));
  res := pg_temp.anotar(res, 'O · Opiniones', 'A SÍ puede opinar sobre el curso que hizo',
         'escribió 1 fila', txt, txt like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'insert into public.opiniones_curso (programa_id, alumno_id, puntuacion) values (%L, %L, 1)', prog_ajeno, alu_a));
  res := pg_temp.anotar(res, 'O · Opiniones', 'A no puede opinar sobre un curso que no cursó',
         'bloqueado', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(alu_a, format(
    'update public.opiniones_curso set puntuacion = 1, lo_que_sirvio = ''editado por A'' where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'O · Opiniones', 'A no puede editar la opinión de otro alumno',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(psi, format(
    'update public.opiniones_curso set lo_que_sirvio = ''retocado por el instructor'' where alumno_id = %L', alu_b));
  res := pg_temp.anotar(res, 'O · Opiniones', 'Ni el psicólogo puede retocar lo que opinó un alumno (por diseño)',
         'sin efecto', txt, txt not like 'ESCRIBIÓ%');


  -- =========================================================================
  -- N · VISITANTE SIN SESIÓN (anon) — la anon key está en el bundle público
  -- =========================================================================
  n := pg_temp.ve(null, 'select 1 from public.alumnos');
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede leer la tabla de alumnos',
         'sin permiso (-1)', n::text, n = -1);

  n := pg_temp.ve(null, 'select 1 from public.lecciones');
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede leer el material de los cursos',
         'sin permiso (-1)', n::text, n = -1);

  n := pg_temp.ve(null, 'select 1 from public.solicitudes_registro');
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede leer las consultas que dejaron otros',
         'sin permiso (-1)', n::text, n = -1);

  n := pg_temp.ve(null, 'select 1 from public.entregas');
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede leer las entregas de los alumnos',
         'sin permiso (-1)', n::text, n = -1);

  n := pg_temp.ve(null, 'select 1 from public.ordenes');
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede leer las órdenes de compra',
         'sin permiso (-1)', n::text, n = -1);

  txt := pg_temp.escribe(null,
    'insert into public.solicitudes_registro (nombre, email) values (''spam'', ''spam@auditoria.invalid'')');
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede escribir directo en solicitudes_registro (el form pasa por el servidor)',
         'bloqueado por permisos', txt, txt like 'bloqueado%');

  txt := pg_temp.valor(null, format('select archivo_key from public.ebooks where id = %L', ebook_id));
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no puede leer el archivo del ebook pago',
         '<error 42501>', txt, txt like '<error%');

  n := pg_temp.ve(null, format('select 1 from public.programas where id = %L', prog_ok));
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante no ve un curso que NO está publicado en el home',
         '0 fila(s)', n::text, n = 0);

  update public.programas set publicado_en_home = true where id = prog_ok;
  n := pg_temp.ve(null, format('select 1 from public.programas where id = %L', prog_ok));
  res := pg_temp.anotar(res, 'N · Sin sesión', 'Un visitante SÍ ve la vidriera (curso publicado en el home)',
         '1 fila(s)', n::text, n = 1);

  n := pg_temp.ve(null, format('select tipo from public.programas where id = %L', prog_ok));
  res := pg_temp.anotar(res, 'N · Sin sesión', 'programas.tipo: la lista blanca de columnas de anon no incluye las columnas nuevas',
         'sin permiso (-1)', n::text, n = -1, nota := true);


  -- =========================================================================
  -- Y · PSICÓLOGO — control de que la RLS no rompió el trabajo del instructor
  -- =========================================================================
  n := pg_temp.ve(psi, 'select 1 from public.alumnos');
  res := pg_temp.anotar(res, 'Y · Psicólogo', 'El psicólogo ve a todos los alumnos',
         '3 o más', n || ' fila(s)', n >= 3);

  n := pg_temp.ve(psi, 'select 1 from public.quiz_preguntas');
  res := pg_temp.anotar(res, 'Y · Psicólogo', 'El psicólogo sí lee las preguntas con su respuesta correcta',
         '1 o más', n || ' fila(s)', n >= 1);

  txt := pg_temp.escribe(psi, format(
    'update public.entregas set estado = ''revisada'', comentario_instructor = ''Buen trabajo'' where id = %L', entrega_a));
  res := pg_temp.anotar(res, 'Y · Psicólogo', 'El psicólogo sí puede corregir una entrega',
         'escribió 1 fila', txt, txt like 'ESCRIBIÓ%');

  txt := pg_temp.escribe(psi, format(
    'insert into public.programas_asignados (alumno_id, programa_id) values (%L, %L)', alu_a, prog_ajeno));
  res := pg_temp.anotar(res, 'Y · Psicólogo', 'El psicólogo sí puede asignar un curso a un alumno',
         'escribió 1 fila', txt, txt like 'ESCRIBIÓ%');

  n := pg_temp.ve(psi, 'select 1 from public.solicitudes_registro');
  res := pg_temp.anotar(res, 'Y · Psicólogo', 'Ni el psicólogo lee solicitudes_registro por la Data API (va por el servidor)',
         '0 fila(s)', n || ' fila(s)', n = 0, nota := true);


  -- ======== fin: deshacer TODO lo creado por esta corrida ========
  raise exception 'AUDITORIA_ROLLBACK';

  exception
    when sqlstate 'P0001' then
      if sqlerrm <> 'AUDITORIA_ROLLBACK' then
        res := pg_temp.anotar(res, 'M · Meta', 'La batería terminó completa',
               'sin errores', 'cortó en: ' || sqlerrm, false);
      end if;
    when others then
      res := pg_temp.anotar(res, 'M · Meta', 'La batería terminó completa',
             'sin errores', 'cortó con ' || sqlstate || ': ' || sqlerrm, false);
  end;

  perform set_config('role', 'none', true);

  return query
  select e->>'veredicto', e->>'grupo', e->>'prueba', e->>'esperado', e->>'obtenido'
  from jsonb_array_elements(res) e
  order by
    case e->>'veredicto' when 'FALLA' then 0 when 'NOTA' then 1 else 2 end,
    (e->>'i')::int;
end
$fn$;


select * from pg_temp.tests_rls();
