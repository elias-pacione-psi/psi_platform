-- ============================================================================
-- Quiz: intentos libres (se saca el tope de 3 y el reinicio manual)
-- Correr en el SQL Editor del proyecto ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Decisión de Lucas (2026-08-28): un alumno que no aprueba un quiz puede seguir
-- reintentando sin límite — no hace falta que el psicólogo le "devuelva" intentos.
-- Reemplaza el tope de 3 (`registrar_intento_quiz` con `p_maximo`) por un intento
-- libre. Lo único que se sigue evitando es que alguien que ya aprobó reenvíe para
-- siempre y engorde la tabla: esa condición antes solo corría al agotar el cupo,
-- ahora corre siempre.
--
-- Aditiva salvo por el drop de la firma vieja de la función (necesario: create or
-- replace no puede sacarle un parámetro). Nada de esto toca `quiz_intentos` ni sus
-- policies — solo la función que la escribe.

begin;

create or replace function public.registrar_intento_quiz(
  p_alumno_id uuid,
  p_leccion_id uuid,
  p_puntaje int,
  p_total int,
  p_aprobado boolean
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

  select count(*), bool_or(aprobado) into v_usados, v_aprobado_previo
    from public.quiz_intentos
   where alumno_id = p_alumno_id and leccion_id = p_leccion_id;

  if v_aprobado_previo then
    return jsonb_build_object('ok', true, 'registrado', false, 'usados', v_usados);
  end if;

  insert into public.quiz_intentos (alumno_id, leccion_id, puntaje, total, aprobado)
  values (p_alumno_id, p_leccion_id, p_puntaje, p_total, p_aprobado);

  return jsonb_build_object('ok', true, 'registrado', true, 'usados', v_usados + 1);
end;
$$;

drop function if exists public.registrar_intento_quiz(uuid, uuid, int, int, boolean, int);

revoke all on function public.registrar_intento_quiz(uuid, uuid, int, int, boolean)
  from public, anon, authenticated;

grant execute on function public.registrar_intento_quiz(uuid, uuid, int, int, boolean)
  to service_role;

commit;
