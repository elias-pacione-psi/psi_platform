-- Actualización del check constraint para permitir 'psicologia_fe' en la columna interes de solicitudes_registro
alter table public.solicitudes_registro drop constraint if exists solicitudes_interes_valido;
alter table public.solicitudes_registro add constraint solicitudes_interes_valido
  check (interes is null or interes in ('curso', 'formacion', 'supervision', 'terapia_individual', 'psicologia_fe', 'otro'));
