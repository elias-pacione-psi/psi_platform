-- ============================================================================
-- Podcast: episodios gratuitos y públicos
-- Correr en el SQL Editor del proyecto urevyngawcybyrfvahgk ANTES de deployar.
-- https://supabase.com/dashboard/project/urevyngawcybyrfvahgk/sql/new
-- ============================================================================
--
-- Qué agrega: la tabla de episodios de /podcast. Es material abierto a todo el público
-- (sin cuenta ni compra), así que `anon` la puede leer — pero solo los publicados, y solo
-- por las columnas que la página necesita. El audio vive en R2 (privado) y la página lo
-- sirve con una URL firmada que arma el servidor en cada visita.
--
-- Es contenido de divulgación, no un registro de nadie: no tiene alumno_id ni ningún dato
-- personal, así que no toca la regla de la Ley 25.326.
--
-- Es ADITIVA e idempotente: se puede correr dos veces sin efecto.

begin;

create table if not exists public.podcast_episodios (
  id uuid primary key default gen_random_uuid(),
  numero int not null check (numero > 0),
  titulo text not null check (length(titulo) between 1 and 150),
  descripcion text check (descripcion is null or length(descripcion) <= 3000),
  -- Marca r2key://<key> (ver src/utils/r2-marcador.ts), igual que ebooks.archivo_key.
  audio_key text not null check (audio_key like 'r2key://%'),
  duracion_segundos int check (duracion_segundos is null or duracion_segundos > 0),
  estado text not null default 'borrador' check (estado in ('borrador', 'publicado')),
  publicado_en date not null default current_date,
  created_at timestamptz not null default now()
);

-- Dos episodios con el mismo número confundirían el orden de la lista.
create unique index if not exists idx_podcast_episodios_numero on public.podcast_episodios (numero);

alter table public.podcast_episodios enable row level security;

-- Mismo esquema que ebooks (ver 2026-09-02-hardening-linter-supabase.sql): anon en su
-- propia policy para que nunca tenga que evaluar es_psicologo().
drop policy if exists "podcast_select_anon" on public.podcast_episodios;
create policy "podcast_select_anon" on public.podcast_episodios
  for select to anon
  using (estado = 'publicado');

drop policy if exists "podcast_select_authenticated" on public.podcast_episodios;
create policy "podcast_select_authenticated" on public.podcast_episodios
  for select to authenticated
  using (estado = 'publicado' or public.es_psicologo());

drop policy if exists "podcast_all_psicologo" on public.podcast_episodios;
create policy "podcast_all_psicologo" on public.podcast_episodios
  for all to authenticated
  using (public.es_psicologo())
  with check (public.es_psicologo());

-- schema.sql le saca a anon los privilegios por defecto: sin este GRANT la policy de
-- arriba nunca llega a evaluarse. Por columna, como en ebooks: lo que lee app/podcast.
grant select (id, numero, titulo, descripcion, audio_key, duracion_segundos, estado, publicado_en)
  on public.podcast_episodios to anon;

commit;
