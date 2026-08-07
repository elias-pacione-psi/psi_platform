-- ============================================================================
-- Emails transaccionales: tabla de auditoría + dedup del recordatorio diario
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Aditiva e idempotente: solo crea una tabla nueva, no toca nada existente. Se
-- puede correr dos veces sin efecto.
--
-- Los mails de Supabase Auth (invitación, recuperar contraseña) NO pasan por acá —
-- esos van por el Send Email Hook (supabase/functions/send-email), que loguea aparte
-- con los logs de la Edge Function. Esta tabla es solo para los mails que manda la
-- app directamente por Resend (src/utils/email/resend.ts).

begin;

create table if not exists public.emails_enviados (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in (
    'asignacion_programa', 'entrega_revisada', 'clase_agendada', 'recordatorio_clase'
  )),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  destinatario_email text not null, -- a dónde se mandó de verdad (auditoría; puede
                                     -- no coincidir con alumnos.email si ese cambió después)
  -- Puntero liviano a la entrega/sesión/etc. que originó el envío. Sin fk: según
  -- `tipo` apunta a una tabla distinta (entregas.id, agenda_sesiones.id, o nada).
  referencia_id uuid,
  -- Día (calendario Argentina) que cubre el resumen de 'recordatorio_clase'. Se
  -- guarda explícito, calculado una sola vez en el cron, en vez de derivarlo de
  -- created_at::date — ese cast depende del timezone de sesión de Postgres, y acá
  -- la clave de dedup no se puede dar el lujo de desalinearse por eso.
  fecha_referencia date,
  estado text not null check (estado in ('enviado', 'error')),
  error text, -- mensaje si estado='error', para no tener que ir a buscar logs
  resend_id text, -- id que devuelve Resend; sirve para correlacionar a futuro
  created_at timestamptz not null default now()
);

create index if not exists idx_emails_enviados_alumno
  on public.emails_enviados (alumno_id, created_at desc);

-- Candado real de dedup del recordatorio diario: un alumno no puede tener dos filas
-- 'enviado' para el mismo día. Filtrado a estado='enviado' a propósito — si el primer
-- intento falló (Resend caído, etc.), un reintento tiene que poder insertar su propia
-- fila 'enviado' sin chocar contra el intento fallido anterior.
create unique index if not exists idx_emails_enviados_dedup_recordatorio
  on public.emails_enviados (alumno_id, fecha_referencia)
  where tipo = 'recordatorio_clase' and estado = 'enviado';

alter table public.emails_enviados enable row level security;

-- Solo lectura para el psicólogo (auditoría). Sin policy de insert/update/delete para
-- `authenticated` a propósito: esta tabla la escribe únicamente el service role desde
-- enviarMail()/enviarMailBatch() (src/utils/email/resend.ts) y el cron — ni el alumno
-- ni el propio psicólogo la tocan nunca desde su sesión normal. Mismo criterio que
-- quiz_preguntas: sin policy de escritura para authenticated.
drop policy if exists "emails_enviados_select_psicologo" on public.emails_enviados;
create policy "emails_enviados_select_psicologo" on public.emails_enviados
  for select to authenticated
  using (public.es_psicologo());

commit;
