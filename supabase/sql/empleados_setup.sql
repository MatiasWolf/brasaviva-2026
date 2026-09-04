-- ============================================================================
--  Punto 1 — Agregar empleado
--  Ejecutar UNA vez en el SQL Editor de Supabase (panel del proyecto).
--  Todo es idempotente: se puede correr de nuevo sin romper nada.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0. GRANTs de tabla.
--    El proyecto tiene un event trigger `ensure_rls` / `rls_auto_enable()` que
--    activa RLS (y suele revocar privilegios) en las tablas. Sin estos GRANTs,
--    la Edge Function (que corre como `service_role`) recibe
--    "permission denied for table usuarios".
-- ----------------------------------------------------------------------------
grant usage on schema public to service_role, authenticated, anon;

grant select, insert, update, delete on public.usuarios to service_role;
grant select                          on public.roles    to service_role;

-- Cliente logueado: leer siempre; editar sólo lo habilita la policy de más abajo.
grant select, update on public.usuarios to authenticated;
grant select          on public.roles   to authenticated, anon;


-- ----------------------------------------------------------------------------
-- 1. Helper: rol del usuario autenticado, sin disparar RLS (SECURITY DEFINER).
--    Evita la recursión infinita de tener una policy de `usuarios` que a su
--    vez consulta `usuarios`.
-- ----------------------------------------------------------------------------
create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.nombre
  from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where u.id = auth.uid()
$$;

revoke all on function public.rol_actual() from public;
grant execute on function public.rol_actual() to authenticated;


-- ----------------------------------------------------------------------------
-- 2. Policies sobre public.usuarios
--    - Cada usuario sigue leyendo su propia fila (para el login / perfil).
--    - Dueño y supervisor pueden leer y editar a todos.
--    (El alta y la baja pasan por Edge Functions con service_role, que ignoran RLS.)
-- ----------------------------------------------------------------------------
alter table public.usuarios enable row level security;

drop policy if exists "usuarios_lee_su_fila" on public.usuarios;
create policy "usuarios_lee_su_fila"
  on public.usuarios
  for select
  using (id = auth.uid());

drop policy if exists "admin_lee_usuarios" on public.usuarios;
create policy "admin_lee_usuarios"
  on public.usuarios
  for select
  using (public.rol_actual() in ('dueño', 'supervisor'));

drop policy if exists "admin_edita_usuarios" on public.usuarios;
create policy "admin_edita_usuarios"
  on public.usuarios
  for update
  using (public.rol_actual() in ('dueño', 'supervisor'))
  with check (public.rol_actual() in ('dueño', 'supervisor'));


-- ----------------------------------------------------------------------------
-- 3. Lectura de roles para poblar el <ion-select> del formulario.
--    Si ya tenés una policy que permite leer `roles`, esta es redundante
--    (no molesta).
-- ----------------------------------------------------------------------------
alter table public.roles enable row level security;

drop policy if exists "roles_lectura_autenticados" on public.roles;
create policy "roles_lectura_autenticados"
  on public.roles
  for select
  to authenticated
  using (true);


-- ----------------------------------------------------------------------------
-- 4. Botón "Empleados" en el menú del home para dueño y supervisor.
--    Ajustá los nombres de columna si tu esquema difiere
--    (ver src/app/core/services/menu.service.ts).
-- ----------------------------------------------------------------------------
insert into public.botones_menu (clave, titulo, icono, ruta, orden, activo)
values ('empleados', 'Empleados', 'people-outline', '/empleados', 90, true)
on conflict (clave)
  do update set
    titulo = excluded.titulo,
    icono  = excluded.icono,
    ruta   = excluded.ruta,
    activo = true;

insert into public.rol_botones (boton_id, rol_id, contexto)
select b.id, r.id, 'siempre'
from public.botones_menu b
cross join public.roles r
where b.clave = 'empleados'
  and r.nombre in ('dueño', 'supervisor')
on conflict do nothing;


-- ----------------------------------------------------------------------------
-- 5. Bucket de fotos (ya lo usa el registro de cliente). Por si no existe:
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos-perfiles', 'fotos-perfiles', true)
on conflict (id) do nothing;
