-- ============================================================================
-- Plataforma Psicólogo — Esquema completo de Supabase
-- Correr UNA VEZ en Supabase → SQL Editor (es idempotente: se puede re-correr).
--
-- Principio de diseño (Ley 25.326): el modelo de datos del paciente se limita
-- a CUENTA + CONTENIDO ASIGNADO + AGENDA. No hay campos de diagnóstico, motivo
-- de consulta ni notas clínicas. NO agregar columnas de salud sin revisar
-- las implicancias legales (datos sensibles).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) TABLAS
-- ----------------------------------------------------------------------------

-- Perfil de usuario. El rol vive acá (no en metadata de auth).
create table if not exists public.pacientes (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  telefono text,
  link_videollamada text,
  rol text not null default 'paciente' check (rol in ('paciente', 'psicologo')),
  estado text not null default 'activo' check (estado in ('activo', 'suspendido', 'eliminado')),
  created_at timestamptz not null default now()
);

-- Programas: carpetas temáticas de contenido (ej: "Manejo de la ansiedad")
create table if not exists public.programas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

-- Unidades: agrupador dentro de un programa (ej: "Semana 1: Psicoeducación")
create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid not null references public.programas(id) on delete cascade,
  titulo text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

-- Actividades: el material concreto (video, PDF, audio, texto, enlace)
create table if not exists public.actividades (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid not null references public.programas(id) on delete cascade,
  unidad_id uuid not null references public.unidades(id) on delete cascade,
  titulo text not null,
  tipo_contenido text not null,
  url_recurso text not null, -- URL externa, o path dentro del bucket 'materiales' si tipo_contenido empieza con 'supabase_'
  created_at timestamptz not null default now()
);

-- Asignación de programas por paciente
create table if not exists public.programas_asignados (
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  programa_id uuid not null references public.programas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (paciente_id, programa_id)
);

-- Biblioteca: recursos sueltos, fuera de la estructura de programas
create table if not exists public.biblioteca_recursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo_contenido text not null,
  url_recurso text not null, -- misma convención que actividades
  created_at timestamptz not null default now()
);

-- Asignación de recursos de biblioteca por paciente
create table if not exists public.recursos_asignados (
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  recurso_id uuid not null references public.biblioteca_recursos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (paciente_id, recurso_id)
);

-- Agenda de sesiones (con videollamada vía pacientes.link_videollamada)
create table if not exists public.agenda_sesiones (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha_hora timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_unidades_programa on public.unidades (programa_id);
create index if not exists idx_actividades_programa on public.actividades (programa_id);
create index if not exists idx_actividades_unidad on public.actividades (unidad_id);
create index if not exists idx_agenda_paciente_fecha on public.agenda_sesiones (paciente_id, fecha_hora);

-- ----------------------------------------------------------------------------
-- 2) HELPER DE ROL
-- security definer para no recursar sobre las policies de `pacientes`.
-- ----------------------------------------------------------------------------

create or replace function public.es_psicologo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.pacientes
    where id = auth.uid() and rol = 'psicologo'
  );
$$;

-- ----------------------------------------------------------------------------
-- 3) TRIGGER: crea el perfil al nacer el usuario en auth.users
-- Lee la metadata enviada en inviteUserByEmail({ data: { nombre, telefono } }).
-- El rol NUNCA sale de la metadata: siempre nace 'paciente'.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pacientes (id, email, nombre, telefono)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), 'Nuevo paciente'),
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

-- ----------------------------------------------------------------------------
-- 4) RLS — la capa real de seguridad. Regla: el paciente solo ve lo suyo
-- (auth.uid() = paciente_id) o lo que tiene asignado; el psicólogo ve todo.
-- Nunca `qual = true` sin scope.
-- ----------------------------------------------------------------------------

alter table public.pacientes enable row level security;
alter table public.programas enable row level security;
alter table public.unidades enable row level security;
alter table public.actividades enable row level security;
alter table public.programas_asignados enable row level security;
alter table public.biblioteca_recursos enable row level security;
alter table public.recursos_asignados enable row level security;
alter table public.agenda_sesiones enable row level security;

-- pacientes: cada uno ve su perfil; el psicólogo ve y edita todos.
-- Sin policy de INSERT/DELETE: eso pasa solo por el trigger y el cliente
-- service-role (createAdminClient), que saltea RLS.
drop policy if exists "pacientes_select" on public.pacientes;
create policy "pacientes_select" on public.pacientes
  for select to authenticated
  using (id = auth.uid() or public.es_psicologo());

drop policy if exists "pacientes_update_psicologo" on public.pacientes;
create policy "pacientes_update_psicologo" on public.pacientes
  for update to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- programas / unidades / actividades: el paciente solo ve contenido de
-- programas que tiene asignados; el psicólogo tiene CRUD completo.
drop policy if exists "programas_select" on public.programas;
create policy "programas_select" on public.programas
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.programas_asignados pa
      where pa.programa_id = programas.id and pa.paciente_id = auth.uid()
    )
  );

drop policy if exists "programas_all_psicologo" on public.programas;
create policy "programas_all_psicologo" on public.programas
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "unidades_select" on public.unidades;
create policy "unidades_select" on public.unidades
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.programas_asignados pa
      where pa.programa_id = unidades.programa_id and pa.paciente_id = auth.uid()
    )
  );

drop policy if exists "unidades_all_psicologo" on public.unidades;
create policy "unidades_all_psicologo" on public.unidades
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "actividades_select" on public.actividades;
create policy "actividades_select" on public.actividades
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.programas_asignados pa
      where pa.programa_id = actividades.programa_id and pa.paciente_id = auth.uid()
    )
  );

drop policy if exists "actividades_all_psicologo" on public.actividades;
create policy "actividades_all_psicologo" on public.actividades
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- tablas puente de asignación
drop policy if exists "programas_asignados_select" on public.programas_asignados;
create policy "programas_asignados_select" on public.programas_asignados
  for select to authenticated
  using (paciente_id = auth.uid() or public.es_psicologo());

drop policy if exists "programas_asignados_write" on public.programas_asignados;
create policy "programas_asignados_write" on public.programas_asignados
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

drop policy if exists "recursos_asignados_select" on public.recursos_asignados;
create policy "recursos_asignados_select" on public.recursos_asignados
  for select to authenticated
  using (paciente_id = auth.uid() or public.es_psicologo());

drop policy if exists "recursos_asignados_write" on public.recursos_asignados;
create policy "recursos_asignados_write" on public.recursos_asignados
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- biblioteca: el paciente solo ve recursos que le fueron asignados
drop policy if exists "biblioteca_select" on public.biblioteca_recursos;
create policy "biblioteca_select" on public.biblioteca_recursos
  for select to authenticated
  using (
    public.es_psicologo()
    or exists (
      select 1 from public.recursos_asignados ra
      where ra.recurso_id = biblioteca_recursos.id and ra.paciente_id = auth.uid()
    )
  );

drop policy if exists "biblioteca_all_psicologo" on public.biblioteca_recursos;
create policy "biblioteca_all_psicologo" on public.biblioteca_recursos
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- agenda: el paciente ve sus sesiones; el psicólogo gestiona todas
drop policy if exists "agenda_select" on public.agenda_sesiones;
create policy "agenda_select" on public.agenda_sesiones
  for select to authenticated
  using (paciente_id = auth.uid() or public.es_psicologo());

drop policy if exists "agenda_all_psicologo" on public.agenda_sesiones;
create policy "agenda_all_psicologo" on public.agenda_sesiones
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- ----------------------------------------------------------------------------
-- 5) STORAGE — bucket PRIVADO 'materiales'
-- El psicólogo sube/borra desde el navegador (estas policies lo permiten).
-- Los pacientes NUNCA acceden directo: el servidor genera URLs firmadas
-- (createSignedUrl con service-role) después de verificar la asignación.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('materiales', 'materiales', false)
on conflict (id) do update set public = false;

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

-- ----------------------------------------------------------------------------
-- 6) BOOTSTRAP DEL PSICÓLOGO (correr a mano, una sola vez)
-- Crear el usuario en Authentication → Add user (o invitarlo), y después:
--
--   update public.pacientes set rol = 'psicologo' where email = 'EMAIL_DEL_PSICOLOGO';
-- ----------------------------------------------------------------------------
