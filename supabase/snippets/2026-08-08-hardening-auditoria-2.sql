-- ============================================================================
-- Segunda ronda de hardening — auditoría del 2026-08-08
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente: reemplaza dos funciones y un trigger, no borra datos, se
-- puede correr dos veces sin efecto. Va junto con los cambios de código de la rama
-- fix/auditoria-kimi-2026-08-08 — el SQL solo no alcanza para el punto 2.
--
-- Sale de una auditoría independiente que revisó el estado posterior al hardening
-- del 2026-08-05. Los dos hallazgos de acá estaban en código de esa misma ronda.

begin;

-- ----------------------------------------------------------------------------
-- 1) El trigger de entregas pasa a cubrir INSERT, no sólo UPDATE
-- ----------------------------------------------------------------------------
-- trg_proteger_entrega era `before update` solamente. La policy entregas_insert_propio
-- valida dueño, prefijo del archivo y lección asignada, pero no dice nada de `estado` ni
-- de `comentario_instructor` — así que un POST directo a /rest/v1/entregas con:
--
--   {"leccion_id":"<propia>", "alumno_id":"<su uid>",
--    "archivo_url":"r2key://entregas/<su uid>/x.pdf",
--    "estado":"revisada", "comentario_instructor":"Excelente, aprobado."}
--
-- pasaba el WITH CHECK y creaba una entrega ya "revisada" con una devolución escrita por
-- el propio alumno. No lee datos ajenos, pero la UI muestra ese texto como si fuera del
-- instructor: rompe la integridad de la corrección.
--
-- De paso se arregla un bug funcional adyacente: volver a subir un archivo después de una
-- corrección conservaba estado='revisada', así que la re-entrega no volvía a la cola del
-- instructor y nadie se enteraba del archivo nuevo.

create or replace function public.proteger_entrega_de_alumno()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if not public.es_psicologo() then
      new.alumno_id := auth.uid();       -- el dueño lo decide la sesión, no el body
      new.estado := 'entregada';         -- una entrega nunca nace revisada
      new.comentario_instructor := null; -- ni con devolución
    end if;
    return new;
  end if;

  if not public.es_psicologo() then
    new.estado := old.estado;
    new.comentario_instructor := old.comentario_instructor;
    new.leccion_id := old.leccion_id;
    new.alumno_id := old.alumno_id;

    if new.archivo_url is distinct from old.archivo_url then
      new.estado := 'entregada';
      new.comentario_instructor := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_entrega on public.entregas;
create trigger trg_proteger_entrega
  before insert or update on public.entregas
  for each row execute function public.proteger_entrega_de_alumno();

-- ----------------------------------------------------------------------------
-- 2) Intentos de quiz: contar y registrar en una sola transacción
-- ----------------------------------------------------------------------------
-- responderQuiz() hacía count → chequeo → insert en queries separadas. Es una race:
-- disparando envíos en paralelo con 2 intentos usados, todos leían "2", todos pasaban el
-- tope de 3, y quedaban 4+ registrados. Como cada respuesta devuelve qué preguntas se
-- acertaron, más intentos de los permitidos es literalmente más información para adivinar
-- — que es justo lo que el tope de intentos venía a cortar.
--
-- El lock es advisory y por par (alumno, lección): no toca filas de negocio, no serializa
-- a dos alumnos distintos ni a la misma persona en dos quizzes distintos.
--
-- `registrado: false` cubre el caso "ya aprobaste y estás repasando": se corrige y se
-- muestra el resultado, pero no se inserta una fila más. Sin eso, quien ya había aprobado
-- podía reenviar para siempre y engordar quiz_intentos sin límite.

create or replace function public.registrar_intento_quiz(
  p_alumno_id uuid,
  p_leccion_id uuid,
  p_puntaje int,
  p_total int,
  p_aprobado boolean,
  p_maximo int default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_usados int;
  v_aprobado_previo boolean;
begin
  perform pg_advisory_xact_lock(hashtext(p_alumno_id::text || ':' || p_leccion_id::text)::bigint);

  select count(*) into v_usados
    from public.quiz_intentos
   where alumno_id = p_alumno_id and leccion_id = p_leccion_id;

  if v_usados >= p_maximo then
    select exists (
      select 1 from public.quiz_intentos
       where alumno_id = p_alumno_id and leccion_id = p_leccion_id and aprobado
    ) into v_aprobado_previo;

    if not v_aprobado_previo then
      return jsonb_build_object('error', 'sin_intentos', 'usados', v_usados);
    end if;

    return jsonb_build_object('ok', true, 'registrado', false, 'usados', v_usados);
  end if;

  insert into public.quiz_intentos (alumno_id, leccion_id, puntaje, total, aprobado)
  values (p_alumno_id, p_leccion_id, p_puntaje, p_total, p_aprobado);

  return jsonb_build_object('ok', true, 'registrado', true, 'usados', v_usados + 1);
end;
$$;

-- Sólo el servidor (service-role) la llama, desde responderQuiz. Sin este revoke, el
-- `grant all on all routines ... to authenticated` de schema.sql la dejaría invocable por
-- cualquier alumno vía /rest/v1/rpc — que es exactamente el camino que quiz_intentos había
-- cerrado al quedarse sin policy de insert. Sería regalar de vuelta lo que ya se cerró.
-- Postgres además da EXECUTE a PUBLIC por default en toda función nueva, así que hay que
-- nombrar a public explícitamente.
revoke all on function public.registrar_intento_quiz(uuid, uuid, int, int, boolean, int)
  from public, anon, authenticated;

-- Explícito, no heredado del `alter default privileges` de schema.sql: si esa línea no
-- hubiera corrido en esta base, la función quedaría sin EXECUTE para nadie y responderQuiz
-- fallaría para TODOS los alumnos. Un grant de más no cuesta nada; romper el quiz entero
-- por depender de un privilegio implícito, sí.
grant execute on function public.registrar_intento_quiz(uuid, uuid, int, int, boolean, int)
  to service_role;

commit;

-- ----------------------------------------------------------------------------
-- 3) ESTADO DE LOS PENDIENTES DEL DASHBOARD
-- ----------------------------------------------------------------------------
-- a) HECHO. "Allow new users to sign up" quedó en OFF: verificado contra producción
--    el 2026-08-08, /auth/v1/signup responde `signup_disabled`.
-- b) PENDIENTE. Authentication → Policies → Minimum password length = 12 y
--    Password requirements = lower/upper/digits/symbols. El 2026-08-05 el servidor
--    aceptaba "abcdef" (6 caracteres, sin requisitos). No se pudo volver a verificar
--    ahora porque el probe salía por /auth/v1/signup, que ya está cerrado — hay que
--    mirarlo en el panel.
