-- ============================================================================
-- Plataforma de Cursos (Psicología) — Esquema completo de Supabase
-- Correr UNA VEZ en Supabase → SQL Editor (es idempotente: se puede re-correr).
--
-- Principio de diseño (Ley 25.326): la plataforma dicta CURSOS/FORMACIONES.
-- El modelo del alumno se limita a CUENTA + CONTENIDO ASIGNADO + AGENDA +
-- PROGRESO EDUCATIVO (lección completada, intento de quiz, entrega de trabajo).
-- NO hay diagnóstico, motivo de consulta ni notas clínicas. Aunque los cursos
-- ENSEÑEN sobre escalas clínicas (PHQ-9/GAD-7), la plataforma NO las implementa
-- como instrumentos: son materia, no funciones. No agregar campos de salud.
--
-- Jerarquía de contenido:  programas (curso) → modulos → lecciones
-- Organización de alumnos:  cohortes (camadas) que agrupan alumnos por curso
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABLAS
-- ----------------------------------------------------------------------------

-- Perfil de usuario. El rol vive acá (no en metadata de auth).
create table if not exists public.alumnos (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  telefono text,
  link_videollamada text,
  -- `rol` es SOLO el rol de seguridad: de acá cuelga es_psicologo() y con eso toda la
  -- RLS del panel. Qué es la persona para el psicólogo (alumno / paciente) vive en los
  -- dos flags de abajo, no acá — ver snippets/2026-09-05b.
  rol text not null default 'alumno' check (rol in ('alumno', 'psicologo')),
  estado text not null default 'activo' check (estado in ('activo', 'suspendido', 'eliminado')),
  created_at timestamptz not null default now()
);

-- Vínculo con el psicólogo, NO excluyente: alguien puede cursar una formación y además
-- atenderse. Para la RLS los dos son lo mismo (cada uno ve lo suyo), así que esto es
-- organizativo: define en qué lista del panel aparece y qué menú ve al entrar.
-- `es_paciente` es un booleano y nada más — no hay ni va a haber campos clínicos
-- colgando de acá (Ley 25.326, ver AGENTS.md).
alter table public.alumnos add column if not exists es_alumno boolean not null default true;
alter table public.alumnos add column if not exists es_paciente boolean not null default false;

create index if not exists idx_alumnos_es_alumno on public.alumnos (es_alumno) where es_alumno;
create index if not exists idx_alumnos_es_paciente on public.alumnos (es_paciente) where es_paciente;

-- Programas = cursos / formaciones (ej: "Formación en TCC")
create table if not exists public.programas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

-- Modulos: agrupador dentro de un curso (ej: "Módulo 8: Herramientas Digitales")
create table if not exists public.modulos (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid not null references public.programas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Lecciones: el material concreto (video, PDF, audio, texto, quiz, entrega)
create table if not exists public.lecciones (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid not null references public.programas(id) on delete cascade,
  modulo_id uuid not null references public.modulos(id) on delete cascade,
  titulo text not null,
  tipo_contenido text not null,
  url_recurso text not null default '', -- URL externa, path del bucket (supabase_*/r2_*), markdown, o '' para quiz/entrega
  orden int not null default 0,
  fecha_limite timestamptz, -- solo relevante para tipo_contenido='entrega'; null = sin vencimiento
  created_at timestamptz not null default now()
);
alter table public.lecciones add column if not exists fecha_limite timestamptz;

-- Cohortes: camadas que cursan uno o más programas juntas (8 semanas, etc.)
create table if not exists public.cohortes (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid references public.programas(id) on delete cascade,
  nombre text not null,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz not null default now()
);
-- programa_id queda (histórico, ver cohortes_programas abajo) pero deja de ser
-- obligatoria: una cohorte pasa a poder asociar varios programas a la vez.
alter table public.cohortes alter column programa_id drop not null;

-- Horario de cursada. dias_semana usa la convención de JS/Postgres `dow`:
-- 0 = domingo … 6 = sábado. Es un array para poder decir "martes y jueves" sin
-- inventar una tabla más.
alter table public.cohortes add column if not exists dias_semana smallint[];
alter table public.cohortes add column if not exists hora_inicio time;
alter table public.cohortes add column if not exists hora_fin time;

alter table public.cohortes drop constraint if exists cohortes_dias_semana_validos;
alter table public.cohortes add constraint cohortes_dias_semana_validos
  check (
    dias_semana is null
    or (array_length(dias_semana, 1) between 1 and 7
        and dias_semana <@ array[0,1,2,3,4,5,6]::smallint[])
  );

alter table public.cohortes drop constraint if exists cohortes_horario_coherente;
alter table public.cohortes add constraint cohortes_horario_coherente
  check (hora_inicio is null or hora_fin is null or hora_fin > hora_inicio);

-- Inscripción de alumnos a cohortes
create table if not exists public.cohortes_alumnos (
  cohorte_id uuid not null references public.cohortes(id) on delete cascade,
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohorte_id, alumno_id)
);

-- Varios programas por cohorte: reemplaza a cohortes.programa_id como fuente de
-- verdad (esa columna queda solo por compatibilidad histórica, ver arriba).
create table if not exists public.cohortes_programas (
  cohorte_id uuid not null references public.cohortes(id) on delete cascade,
  programa_id uuid not null references public.programas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohorte_id, programa_id)
);

create index if not exists idx_cohortes_programas_programa
  on public.cohortes_programas (programa_id);

-- Acceso a contenido: qué programas puede ver cada alumno.
-- Se completa al inscribir a una cohorte (o manualmente). Base de la RLS de contenido.
create table if not exists public.programas_asignados (
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  programa_id uuid not null references public.programas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (alumno_id, programa_id)
);

-- Biblioteca: recursos sueltos, fuera de la estructura de cursos
create table if not exists public.biblioteca_recursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo_contenido text not null,
  url_recurso text not null,
  created_at timestamptz not null default now()
);

-- Asignación de recursos de biblioteca por alumno
create table if not exists public.recursos_asignados (
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  recurso_id uuid not null references public.biblioteca_recursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (alumno_id, recurso_id)
);

-- Libros y Documentos completos adjuntos a una comisión (aparte de sus programas).
-- Tabla puente, espejo de cohortes_programas: el recurso vive en biblioteca_recursos y
-- el acceso del inscripto se DERIVA de la inscripción (policy biblioteca_select), no se
-- materializa en recursos_asignados — así el "Gestionar accesos" de Biblioteca (que
-- borra y reinserta esa tabla) nunca pisa lo que sale por comisión, y dar de baja a
-- alguien revoca el acceso solo. Ver snippets/2026-09-02-cohortes-recursos-libros.sql.
create table if not exists public.cohortes_recursos (
  cohorte_id uuid not null references public.cohortes(id) on delete cascade,
  recurso_id uuid not null references public.biblioteca_recursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohorte_id, recurso_id)
);

create index if not exists idx_cohortes_recursos_recurso
  on public.cohortes_recursos (recurso_id);

-- Progreso educativo: qué lecciones completó cada alumno (booleano, sin datos clínicos)
create table if not exists public.progreso_lecciones (
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  leccion_id uuid not null references public.lecciones(id) on delete cascade,
  completado boolean not null default true,
  completado_at timestamptz not null default now(),
  primary key (alumno_id, leccion_id)
);

-- Preguntas de quiz (de comprensión, educativas — NO instrumentos clínicos)
create table if not exists public.quiz_preguntas (
  id uuid primary key default gen_random_uuid(),
  leccion_id uuid not null references public.lecciones(id) on delete cascade,
  pregunta text not null,
  opciones jsonb not null,            -- array de strings
  respuesta_correcta text not null,   -- NUNCA se envía al navegador del alumno
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Intentos de quiz por alumno (resultado educativo)
create table if not exists public.quiz_intentos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  leccion_id uuid not null references public.lecciones(id) on delete cascade,
  puntaje int not null,
  total int not null,
  aprobado boolean not null,
  created_at timestamptz not null default now()
);

-- Entregas de trabajos (lecciones de tipo 'entrega'). Un archivo + feedback educativo.
create table if not exists public.entregas (
  id uuid primary key default gen_random_uuid(),
  leccion_id uuid not null references public.lecciones(id) on delete cascade,
  alumno_id uuid not null references public.alumnos(id) on delete cascade,
  archivo_url text not null,          -- path en bucket privado 'entregas'
  comentario_alumno text,
  estado text not null default 'entregada' check (estado in ('entregada', 'revisada')),
  comentario_instructor text,         -- feedback pedagógico (no notas clínicas)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (leccion_id, alumno_id)
);

-- Agenda de sesiones: individual (alumno_id) o grupal por cohorte (cohorte_id),
-- virtual (con link) o presencial (con lugar). Exactamente uno de los dos ids.
create table if not exists public.agenda_sesiones (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid references public.alumnos(id) on delete cascade,
  cohorte_id uuid references public.cohortes(id) on delete cascade,
  fecha_hora timestamptz not null,
  tipo text not null default 'virtual' check (tipo in ('virtual', 'presencial')),
  lugar text,        -- para sesiones presenciales (ej: "Dignos, Quilmes")
  enlace text,       -- link de videollamada de la sesión (virtual); si es individual y
                     -- queda vacío, se usa el link_videollamada del alumno
  created_at timestamptz not null default now(),
  constraint agenda_destino_unico check ((alumno_id is not null) <> (cohorte_id is not null))
);
-- Duración real de la sesión. Antes el calendario asumía 1 hora fija para todo;
-- con el horario de la cohorte una clase puede durar 4 (ej: sábados de 8 a 12).
alter table public.agenda_sesiones add column if not exists duracion_minutos int not null default 60;
alter table public.agenda_sesiones drop constraint if exists agenda_duracion_valida;
alter table public.agenda_sesiones add constraint agenda_duracion_valida
  check (duracion_minutos between 15 and 720);

create index if not exists idx_modulos_programa on public.modulos (programa_id);
create index if not exists idx_lecciones_programa on public.lecciones (programa_id);
create index if not exists idx_lecciones_modulo on public.lecciones (modulo_id);
create index if not exists idx_cohortes_programa on public.cohortes (programa_id);
create index if not exists idx_cohortes_alumnos_alumno on public.cohortes_alumnos (alumno_id);
create index if not exists idx_progreso_alumno on public.progreso_lecciones (alumno_id);
create index if not exists idx_quiz_preguntas_leccion on public.quiz_preguntas (leccion_id);
create index if not exists idx_quiz_intentos_alumno on public.quiz_intentos (alumno_id);
create index if not exists idx_entregas_leccion on public.entregas (leccion_id);
create index if not exists idx_entregas_alumno on public.entregas (alumno_id);
create index if not exists idx_agenda_alumno_fecha on public.agenda_sesiones (alumno_id, fecha_hora);
create index if not exists idx_agenda_cohorte_fecha on public.agenda_sesiones (cohorte_id, fecha_hora);

-- Solicitudes de contacto del formulario público de la landing ("Consultas").
-- NO crea cuenta ni es registro público de alumnos: el psicólogo revisa acá y, si
-- corresponde, invita manualmente con crearAlumnoDirecto (el alta sigue siendo por
-- invitación). `objetivos` es el motivo de consulta que cuenta el interesado — dato
-- sensible de salud (Ley 25.326) recolectado pre-alta: sin policies para
-- authenticated/anon a propósito, se escribe y se lee únicamente con
-- createAdminClient() (ver src/app/actions.ts y psicologo/alumnos/page.tsx), mismo
-- patrón que quiz_preguntas. Esta tabla se creó fuera de este archivo en su momento
-- (por eso aparece acá recién ahora, agregada en la auditoría del 2026-08-02) — quedó
-- sin RLS habilitada hasta esta migración.
create table if not exists public.solicitudes_registro (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  objetivos text,
  estado text not null default 'pendiente',
  created_at timestamptz not null default now()
);
alter table public.solicitudes_registro enable row level security;

-- ----------------------------------------------------------------------------
-- 2) HELPERS (security definer para no recursar sobre las policies)
-- ----------------------------------------------------------------------------

create or replace function public.es_psicologo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.alumnos
    where id = auth.uid() and rol = 'psicologo'
  );
$$;

-- cambiarEstadoAlumno() bloquea el acceso en requireUser() (todas las server actions) y
-- con el ban de Auth (invalida el refresh token), pero NO el access token ya emitido: con
-- jwt_expiry = 3600 quedaba hasta una hora de lectura directa contra la Data API/Storage
-- para quien ya estuviera suspendido o eliminado, porque ninguna policy de acá abajo
-- miraba `estado`. Se usa en la policy de storage de `entregas` (la más sensible: archivos
-- de alumnos), no en las de tablas — ahí el guard de las actions ya alcanza hoy.
create or replace function public.usuario_activo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.alumnos
    where id = auth.uid() and estado = 'activo'
  );
$$;

-- ¿El usuario actual tiene acceso a este programa? (asignación directa o vía cohorte)
create or replace function public.tiene_acceso_programa(p_programa_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.programas_asignados pa
    where pa.programa_id = p_programa_id and pa.alumno_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 3) TRIGGERS
-- ----------------------------------------------------------------------------

-- Crea el perfil al nacer el usuario en auth.users. Lee metadata del invite.
-- El rol NUNCA sale de la metadata: siempre nace 'alumno'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.alumnos (id, email, nombre, telefono)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), 'Nuevo alumno'),
    nullif(new.raw_user_meta_data->>'telefono', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Protege campos del instructor en entregas: el alumno NO puede tocar estado
-- ni comentario_instructor (solo su archivo y comentario). Toca updated_at.
--
-- Cubre INSERT ADEMÁS de UPDATE. Sólo con UPDATE quedaba un agujero: la policy de insert
-- valida dueño, prefijo del archivo y lección asignada, pero no dice nada de `estado` ni
-- de `comentario_instructor`, así que un POST directo a /rest/v1/entregas podía crear la
-- fila ya nacida como 'revisada' y con una devolución escrita por el propio alumno. No
-- expone datos ajenos, pero la UI muestra ese texto como si fuera del instructor.
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

    -- Volver a subir después de una corrección devuelve la entrega a la cola del
    -- instructor. Sin esto el estado quedaba 'revisada' con un archivo nuevo adentro, así
    -- que la re-entrega no aparecía como pendiente y nadie la miraba.
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
-- 3.5) GRANTS — en proyectos Supabase nuevos, las tablas creadas por SQL directo
-- NO quedan expuestas a los roles de la Data API por default. Sin esto, cualquier
-- query da "permission denied" aunque la RLS sea correcta: el GRANT es la puerta,
-- RLS filtra las filas.
--
-- `anon` NO recibe privilegios de tabla. Es la clave pública que viaja en el
-- bundle del navegador, o sea que cualquiera en internet la tiene; este portal
-- no expone ninguna superficie anónima (la landing y /privacidad son estáticas y
-- no leen tablas, y el alta de alumnos es por invitación del psicólogo). Dárselo
-- dejaría email, teléfono, agenda y entregas de los alumnos a una sola policy mal
-- escrita de distancia. Se le deja `usage` sobre el schema, que es lo que
-- PostgREST necesita para resolver la request y devolver 401 en vez de 500.
-- ----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
grant all on all routines in schema public to authenticated, service_role;
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant all on sequences to authenticated, service_role;
alter default privileges in schema public grant all on routines to authenticated, service_role;

-- Idempotencia: sacar `anon` de los grants de arriba no revoca lo ya otorgado si
-- este archivo se corrió antes en su versión anterior. Hay que revocarlo explícito.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on routines from anon;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all routines in schema public from anon;

-- ----------------------------------------------------------------------------
-- 4) RLS — la capa real de seguridad. El alumno solo ve lo suyo o lo asignado;
-- el psicólogo ve/gestiona todo. Nunca `qual = true` sin scope.
-- ----------------------------------------------------------------------------

alter table public.alumnos enable row level security;
alter table public.programas enable row level security;
alter table public.modulos enable row level security;
alter table public.lecciones enable row level security;
alter table public.cohortes enable row level security;
alter table public.cohortes_alumnos enable row level security;
alter table public.cohortes_programas enable row level security;
alter table public.programas_asignados enable row level security;
alter table public.biblioteca_recursos enable row level security;
alter table public.recursos_asignados enable row level security;
alter table public.cohortes_recursos enable row level security;
alter table public.progreso_lecciones enable row level security;
alter table public.quiz_preguntas enable row level security;
alter table public.quiz_intentos enable row level security;
alter table public.entregas enable row level security;
alter table public.agenda_sesiones enable row level security;

-- alumnos: cada uno ve su perfil; el psicólogo ve y edita todos.
drop policy if exists "alumnos_select" on public.alumnos;
create policy "alumnos_select" on public.alumnos
  for select to authenticated
  using (id = auth.uid() or public.es_psicologo());

drop policy if exists "alumnos_update_psicologo" on public.alumnos;
create policy "alumnos_update_psicologo" on public.alumnos
  for update to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- programas / modulos / lecciones: el alumno solo ve contenido asignado.
drop policy if exists "programas_select" on public.programas;
create policy "programas_select" on public.programas
  for select to authenticated
  using (public.es_psicologo() or public.tiene_acceso_programa(id));

drop policy if exists "programas_all_psicologo" on public.programas;
create policy "programas_all_psicologo" on public.programas
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "modulos_select" on public.modulos;
create policy "modulos_select" on public.modulos
  for select to authenticated
  using (public.es_psicologo() or public.tiene_acceso_programa(programa_id));

drop policy if exists "modulos_all_psicologo" on public.modulos;
create policy "modulos_all_psicologo" on public.modulos
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "lecciones_select" on public.lecciones;
create policy "lecciones_select" on public.lecciones
  for select to authenticated
  using (public.es_psicologo() or public.tiene_acceso_programa(programa_id));

drop policy if exists "lecciones_all_psicologo" on public.lecciones;
create policy "lecciones_all_psicologo" on public.lecciones
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- cohortes
drop policy if exists "cohortes_select" on public.cohortes;
create policy "cohortes_select" on public.cohortes
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.cohortes_alumnos ca
      where ca.cohorte_id = cohortes.id and ca.alumno_id = auth.uid()
    )
  );

drop policy if exists "cohortes_all_psicologo" on public.cohortes;
create policy "cohortes_all_psicologo" on public.cohortes
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "cohortes_alumnos_select" on public.cohortes_alumnos;
create policy "cohortes_alumnos_select" on public.cohortes_alumnos
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

drop policy if exists "cohortes_alumnos_write" on public.cohortes_alumnos;
create policy "cohortes_alumnos_write" on public.cohortes_alumnos
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- Mismo criterio que cohortes_alumnos: el alumno ve las filas de las cohortes en
-- las que está (necesita saber qué programas cursa), el psicólogo gestiona todo.
drop policy if exists "cohortes_programas_select" on public.cohortes_programas;
create policy "cohortes_programas_select" on public.cohortes_programas
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.cohortes_alumnos ca
      where ca.cohorte_id = cohortes_programas.cohorte_id
        and ca.alumno_id = auth.uid()
    )
  );

drop policy if exists "cohortes_programas_all_psicologo" on public.cohortes_programas;
create policy "cohortes_programas_all_psicologo" on public.cohortes_programas
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- asignación de contenido
drop policy if exists "programas_asignados_select" on public.programas_asignados;
create policy "programas_asignados_select" on public.programas_asignados
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

drop policy if exists "programas_asignados_write" on public.programas_asignados;
create policy "programas_asignados_write" on public.programas_asignados
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "recursos_asignados_select" on public.recursos_asignados;
create policy "recursos_asignados_select" on public.recursos_asignados
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

drop policy if exists "recursos_asignados_write" on public.recursos_asignados;
create policy "recursos_asignados_write" on public.recursos_asignados
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- Libros y Documentos por comisión: el inscripto ve qué tiene su formación (la vista de
-- Biblioteca lo necesita para resolver el acceso); el psicólogo gestiona todo.
drop policy if exists "cohortes_recursos_select" on public.cohortes_recursos;
create policy "cohortes_recursos_select" on public.cohortes_recursos
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.cohortes_alumnos ca
      where ca.cohorte_id = cohortes_recursos.cohorte_id
        and ca.alumno_id = auth.uid()
    )
  );

drop policy if exists "cohortes_recursos_all_psicologo" on public.cohortes_recursos;
create policy "cohortes_recursos_all_psicologo" on public.cohortes_recursos
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- biblioteca: el alumno ve los recursos que le fueron asignados a mano (recursos_asignados)
-- y los adjuntos a las comisiones en las que está inscripto (cohortes_recursos): acceso
-- derivado de la inscripción, no materializado.
drop policy if exists "biblioteca_select" on public.biblioteca_recursos;
create policy "biblioteca_select" on public.biblioteca_recursos
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.recursos_asignados ra
      where ra.recurso_id = biblioteca_recursos.id and ra.alumno_id = auth.uid()
    )
    or exists (
      select 1
      from public.cohortes_recursos cr
      join public.cohortes_alumnos ca on ca.cohorte_id = cr.cohorte_id
      where cr.recurso_id = biblioteca_recursos.id
        and ca.alumno_id = auth.uid()
    )
  );

drop policy if exists "biblioteca_all_psicologo" on public.biblioteca_recursos;
create policy "biblioteca_all_psicologo" on public.biblioteca_recursos
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- progreso: el alumno gestiona el suyo; el psicólogo lo ve (no lo escribe)
drop policy if exists "progreso_select" on public.progreso_lecciones;
create policy "progreso_select" on public.progreso_lecciones
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

-- El WITH CHECK exige además que la lección sea de un programa asignado: antes sólo
-- pedía "esto es mío", así que se podía marcar progreso sobre cualquier leccion_id del
-- sistema. El USING queda sin ese chequeo a propósito — si el psicólogo revoca un
-- programa, las filas viejas tienen que seguir siendo borrables y legibles por su dueño.
drop policy if exists "progreso_write_propio" on public.progreso_lecciones;
create policy "progreso_write_propio" on public.progreso_lecciones
  for all to authenticated
  using (alumno_id = auth.uid())
  with check (
    alumno_id = auth.uid()
    and exists (
      select 1 from public.lecciones l
      where l.id = leccion_id and public.tiene_acceso_programa(l.programa_id)
    )
  );

-- quiz_preguntas: SOLO el psicólogo tiene acceso directo. El alumno nunca lee esta
-- tabla vía API (contiene respuesta_correcta). El servidor usa service-role para
-- mostrar preguntas sin la respuesta y para corregir. Ver src/utils/supabase/quiz.ts
drop policy if exists "quiz_preguntas_psicologo" on public.quiz_preguntas;
create policy "quiz_preguntas_psicologo" on public.quiz_preguntas
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- quiz_intentos: el alumno registra/ve los suyos; el psicólogo ve todos
drop policy if exists "quiz_intentos_select" on public.quiz_intentos;
create policy "quiz_intentos_select" on public.quiz_intentos
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

-- Sin policy de insert para authenticated a propósito: antes solo exigía
-- alumno_id = auth.uid(), sin validar puntaje/aprobado, así que cualquiera con su
-- propia sesión podía llamar a la API de Supabase directo e insertar un resultado
-- inventado (aprobado=true) sin resolver el quiz. corregirQuiz() ya corre en el
-- servidor con service-role (src/utils/supabase/quiz.ts); responderQuiz() ahora
-- también inserta con createAdminClient() en vez del cliente del usuario — mismo
-- patrón que quiz_preguntas, sin este policy no queda otro camino de escritura.
drop policy if exists "quiz_intentos_insert_propio" on public.quiz_intentos;

-- Intentos libres (sin tope): registra el intento y listo. El único caso que NO inserta
-- es "ya había aprobado antes" — si no, quien repasa un quiz ya aprobado para practicar
-- engordaría la tabla sin límite. Esa condición corría antes solo al agotar el cupo de 3;
-- sin cupo, tiene que valer siempre.
--
-- El lock es advisory y por par alumno+lección: serializa el count-then-insert para que
-- dos envíos en paralelo no lean el mismo "no aprobado todavía" y los dos inserten.
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

-- La firma vieja (con p_maximo) queda huérfana si no se dropea: create or replace no
-- puede sacar un parámetro, así que sin este drop las dos versiones convivirían.
drop function if exists public.registrar_intento_quiz(uuid, uuid, int, int, boolean, int);

-- Sólo el servidor (service-role) la llama, desde responderQuiz. Sin este revoke, el
-- `grant all on all routines ... to authenticated` de la sección 3.5 la dejaría invocable
-- por cualquier alumno vía /rest/v1/rpc — que es justo el camino que quiz_intentos cerró
-- al quedarse sin policy de insert. Postgres además da EXECUTE a PUBLIC por default en
-- toda función nueva, así que el revoke tiene que nombrar a public explícitamente.
revoke all on function public.registrar_intento_quiz(uuid, uuid, int, int, boolean)
  from public, anon, authenticated;

-- Explícito y no heredado del `alter default privileges` de la sección 3.5: si esa línea
-- no hubiera corrido en esta base, la función quedaría sin EXECUTE para nadie y
-- responderQuiz fallaría para todos los alumnos. Un grant de más no cuesta nada; que se
-- rompa el quiz entero por un privilegio implícito, sí.
grant execute on function public.registrar_intento_quiz(uuid, uuid, int, int, boolean)
  to service_role;

-- entregas: el alumno crea/ve/edita la suya (el trigger protege campos del
-- instructor); el psicólogo ve todas y las revisa.
drop policy if exists "entregas_select" on public.entregas;
create policy "entregas_select" on public.entregas
  for select to authenticated
  using (alumno_id = auth.uid() or public.es_psicologo());

-- Valida que archivo_url apunte a la carpeta del propio alumno — el mismo chequeo que
-- ya hace perteneceAlAlumno() en src/app/alumno/actions.ts, pero ahora también acá:
-- antes de esta función, la policy solo exigía alumno_id = auth.uid(), así que alguien
-- que llamara a la API de Supabase directo (sin pasar por la server action) podía
-- registrar como propia la key de otro alumno y después leerla firmada desde Tareas.
-- `set search_path` fijo como en el resto de las funciones del archivo: ésta decide una
-- policy, no es el lugar para dejar la resolución de `like`/`||` al search_path del caller.
create or replace function public.archivo_url_pertenece_alumno(url text)
returns boolean
language sql
stable
set search_path = public, pg_catalog
as $$
  select
    url like ('r2key://entregas/' || auth.uid()::text || '/%')
    or url like (auth.uid()::text || '/%')
$$;

-- Al chequeo de "el archivo es mío" se le suma "la lección me corresponde": sin eso se
-- podían crear entregas apuntando a cualquier leccion_id del sistema. Igual que en
-- progreso_lecciones, sólo en el WITH CHECK, para no dejar filas viejas sin poder borrar.
drop policy if exists "entregas_insert_propio" on public.entregas;
create policy "entregas_insert_propio" on public.entregas
  for insert to authenticated
  with check (
    alumno_id = auth.uid()
    and public.archivo_url_pertenece_alumno(archivo_url)
    and exists (
      select 1 from public.lecciones l
      where l.id = leccion_id and public.tiene_acceso_programa(l.programa_id)
    )
  );

drop policy if exists "entregas_update_propio" on public.entregas;
create policy "entregas_update_propio" on public.entregas
  for update to authenticated
  using (alumno_id = auth.uid())
  with check (
    alumno_id = auth.uid()
    and public.archivo_url_pertenece_alumno(archivo_url)
    and exists (
      select 1 from public.lecciones l
      where l.id = leccion_id and public.tiene_acceso_programa(l.programa_id)
    )
  );

drop policy if exists "entregas_update_psicologo" on public.entregas;
create policy "entregas_update_psicologo" on public.entregas
  for update to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- agenda: el alumno ve sus sesiones (individuales o de su cohorte); psicólogo gestiona todo
drop policy if exists "agenda_select" on public.agenda_sesiones;
create policy "agenda_select" on public.agenda_sesiones
  for select to authenticated
  using (
    public.es_psicologo()
    or alumno_id = auth.uid()
    or (cohorte_id is not null and exists (
      select 1 from public.cohortes_alumnos ca
      where ca.cohorte_id = agenda_sesiones.cohorte_id and ca.alumno_id = auth.uid()
    ))
  );

drop policy if exists "agenda_all_psicologo" on public.agenda_sesiones;
create policy "agenda_all_psicologo" on public.agenda_sesiones
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- ----------------------------------------------------------------------------
-- 5) STORAGE
--   'materiales' (privado): sube el psicólogo; el alumno recibe URLs firmadas.
--   'entregas'   (privado): sube el alumno en SU carpeta (entregas/{uid}/...);
--                el psicólogo lee todas; ambos vía URLs firmadas del servidor.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('materiales', 'materiales', false)
on conflict (id) do update set public = false;

-- Tope duro de 100 MB por archivo, espejo de TAMANO_MAXIMO_ENTREGA_BYTES en
-- src/app/alumno/actions.ts. El de la action es una cota blanda (el tamaño lo declara el
-- cliente); éste es el que no se puede mentir. Nota: las entregas nuevas van a R2, que no
-- hereda este límite — allá el equivalente es una regla del bucket.
insert into storage.buckets (id, name, public, file_size_limit)
values ('entregas', 'entregas', false, 104857600)
on conflict (id) do update set public = false, file_size_limit = 104857600;

-- materiales: solo el psicólogo escribe/lee directo
drop policy if exists "materiales_select_psicologo" on storage.objects;
create policy "materiales_select_psicologo" on storage.objects
  for select to authenticated
  using (bucket_id = 'materiales' and public.es_psicologo());

drop policy if exists "materiales_insert_psicologo" on storage.objects;
create policy "materiales_insert_psicologo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materiales' and public.es_psicologo());

drop policy if exists "materiales_update_psicologo" on storage.objects;
create policy "materiales_update_psicologo" on storage.objects
  for update to authenticated
  using (bucket_id = 'materiales' and public.es_psicologo())
  with check (bucket_id = 'materiales' and public.es_psicologo());

drop policy if exists "materiales_delete_psicologo" on storage.objects;
create policy "materiales_delete_psicologo" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materiales' and public.es_psicologo());

-- entregas: el alumno solo su carpeta (primer segmento del path = su uid) y sólo si sigue
-- activo — ver el comentario de usuario_activo() más arriba; psicólogo todo, sin esa
-- condición (lee entregas de cualquiera, incluido alguien que acaba de suspender).
drop policy if exists "entregas_select" on storage.objects;
create policy "entregas_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'entregas'
    and (public.es_psicologo()
         or ((storage.foldername(name))[1] = auth.uid()::text and public.usuario_activo()))
  );

drop policy if exists "entregas_insert_propio" on storage.objects;
create policy "entregas_insert_propio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'entregas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entregas_update_propio" on storage.objects;
create policy "entregas_update_propio" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'entregas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 6) TAXONOMÍA tipo_medio / origen — de dónde vive cada archivo (R2/Drive/Dropbox/
-- Supabase/externo), separado de tipo_contenido (que sigue siendo lo único que usa
-- el código para decidir qué componente renderizar). Aditivo y reversible: alcanza
-- con un `drop column` para deshacerlo. Ver src/utils/taxonomia.ts — el código ya
-- completa estas columnas al crear/editar, esto es solo el backfill de lo existente.
-- Por qué separar: tipo_contenido (drive_pdf, dropbox_video…) dejó de ser confiable
-- para decir DÓNDE vive un archivo apenas empezaron a convivir recursos en R2 con
-- tipo_contenido heredado de antes (ej.: 16 lecciones sembradas como 'r2_pdf' que se
-- normalizaron a 'drive_pdf' en esta misma migración). origen se deriva de la URL
-- real (extraerKeyDeR2 en utils/r2.ts), nunca del prefijo de tipo_contenido.
-- ----------------------------------------------------------------------------

alter table public.lecciones add column if not exists tipo_medio text;
alter table public.lecciones add column if not exists origen text;
alter table public.biblioteca_recursos add column if not exists tipo_medio text;
alter table public.biblioteca_recursos add column if not exists origen text;

update public.lecciones set tipo_medio = case
  when tipo_contenido like '%\_video' escape '\' then 'video'
  when tipo_contenido like '%\_audio' escape '\' then 'audio'
  when tipo_contenido like '%\_pdf' escape '\' then 'pdf'
  when tipo_contenido = 'drive_image' then 'imagen'
  when tipo_contenido = 'texto_markdown' then 'markdown'
  when tipo_contenido = 'quiz' then 'quiz'
  when tipo_contenido = 'entrega' then 'entrega'
  else null
end
where tipo_medio is null;

update public.biblioteca_recursos set tipo_medio = case
  when tipo_contenido like '%\_video' escape '\' then 'video'
  when tipo_contenido like '%\_audio' escape '\' then 'audio'
  when tipo_contenido like '%\_pdf' escape '\' then 'pdf'
  when tipo_contenido = 'enlace_externo' then 'enlace'
  else null
end
where tipo_medio is null;

update public.lecciones set origen = case
  when url_recurso like 'r2key://%' then 'r2'
  when url_recurso like '%.r2.cloudflarestorage.com/%' then 'r2'
  when url_recurso like '%supabase.co/storage/%' then 'supabase'
  when url_recurso like '%drive.google.com%' or url_recurso like '%docs.google.com%' then 'drive'
  when url_recurso like '%dropbox.com%' then 'dropbox'
  when tipo_contenido like 'supabase\_%' escape '\' then 'supabase'
  else null
end
where origen is null;

update public.biblioteca_recursos set origen = case
  when url_recurso like 'r2key://%' then 'r2'
  when url_recurso like '%.r2.cloudflarestorage.com/%' then 'r2'
  when url_recurso like '%supabase.co/storage/%' then 'supabase'
  when url_recurso like '%drive.google.com%' or url_recurso like '%docs.google.com%' then 'drive'
  when url_recurso like '%dropbox.com%' then 'dropbox'
  when tipo_contenido like 'supabase\_%' escape '\' then 'supabase'
  when tipo_contenido = 'enlace_externo' then 'externo'
  else null
end
where origen is null;

-- ----------------------------------------------------------------------------
-- 7) BOOTSTRAP DEL PSICÓLOGO (correr a mano, una sola vez)
-- Crear el usuario en Authentication → Add user (o invitarlo), y después:
--
--   update public.alumnos set rol = 'psicologo' where email = 'EMAIL_DEL_INSTRUCTOR';
-- ----------------------------------------------------------------------------
