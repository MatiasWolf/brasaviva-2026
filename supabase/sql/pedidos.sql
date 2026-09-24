-- Brasa Viva - Pedidos (puntos 16, 17 y 18)
-- Correr una vez en Supabase > SQL Editor. Es idempotente.
--
-- Las tablas pedidos e items_pedido ya existen (las creo el punto 12). Este
-- script no las recrea ni les toca las columnas: agrega los triggers, las
-- politicas, el realtime y las rutas de los botones del menu.


-- 1. Tablas (solo por si hay que rehacer la base de cero)

create table if not exists public.pedidos (
  id             bigint generated always as identity primary key,
  ocupacion_id   bigint      not null references public.ocupaciones_mesa (id) on delete cascade,
  estado         text        not null default 'pendiente',
  importe_total  numeric(10, 2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.items_pedido (
  id               bigint generated always as identity primary key,
  pedido_id        bigint      not null references public.pedidos (id) on delete cascade,
  producto_id      bigint      not null references public.productos (id),
  cantidad         integer     not null,
  precio_unitario  numeric(10, 2) not null,
  sector           text        not null,
  estado_item      text        not null default 'pendiente',
  created_at       timestamptz not null default now()
);

create index if not exists pedidos_estado_idx      on public.pedidos (estado);
create index if not exists pedidos_ocupacion_idx   on public.pedidos (ocupacion_id);
create index if not exists items_pedido_pedido_idx on public.items_pedido (pedido_id);
create index if not exists items_pedido_sector_idx on public.items_pedido (sector, estado_item);


-- 2. Estados validos
-- Se sacan los CHECK viejos de estado, que no conocian en_preparacion / listo /
-- entregado y hacian fallar a cocina y bar al guardar.

do $$
declare
  r record;
begin
  for r in
    select con.conname, rel.relname
      from pg_constraint con
      join pg_class     rel on rel.oid = con.conrelid
      join pg_namespace ns  on ns.oid  = rel.relnamespace
     where ns.nspname = 'public'
       and con.contype = 'c'
       and (
         (rel.relname = 'pedidos'
          and pg_get_constraintdef(con.oid) ilike '%estado%'
          and con.conname <> 'pedidos_estado_valido')
         or
         (rel.relname = 'items_pedido'
          and pg_get_constraintdef(con.oid) ilike '%estado_item%'
          and con.conname <> 'items_pedido_estado_valido')
       )
  loop
    execute format('alter table public.%I drop constraint %I', r.relname, r.conname);
  end loop;
end;
$$;

-- Los default que traia la base no eran estos estados.
alter table public.pedidos      alter column estado      set default 'pendiente';
alter table public.items_pedido alter column estado_item set default 'pendiente';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pedidos_estado_valido') then
    alter table public.pedidos
      add constraint pedidos_estado_valido check (estado in (
        'pendiente', 'rechazado', 'confirmado', 'en_preparacion', 'listo', 'entregado'
      ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'items_pedido_estado_valido') then
    alter table public.items_pedido
      add constraint items_pedido_estado_valido check (estado_item in (
        'pendiente', 'en_preparacion', 'listo'
      ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'items_pedido_sector_valido') then
    alter table public.items_pedido
      add constraint items_pedido_sector_valido check (sector in ('cocina', 'bar'));
  end if;
end;
$$;


-- 3. Triggers

-- updated_at automatico. La pantalla del mozo lo usa para mostrar hace cuanto
-- que el pedido esta listo.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pedidos_updated_at on public.pedidos;
create trigger pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.tocar_updated_at();


-- El sector sale de la categoria del producto: 2 = bebida -> bar, el resto
-- -> cocina.
create or replace function public.items_pedido_completar_sector()
returns trigger
language plpgsql
as $$
declare
  v_categoria bigint;
begin
  select categoria_id into v_categoria
    from public.productos
   where id = new.producto_id;

  if v_categoria is null then
    raise exception 'El producto % no existe.', new.producto_id;
  end if;

  new.sector := case when v_categoria = 2 then 'bar' else 'cocina' end;
  return new;
end;
$$;

drop trigger if exists items_pedido_sector on public.items_pedido;
create trigger items_pedido_sector
  before insert on public.items_pedido
  for each row execute function public.items_pedido_completar_sector();


-- Punto 18: el estado del pedido se deduce del estado de sus items. Se calcula
-- en la base porque cocina y bar terminan desde dispositivos distintos, y si lo
-- hiciera cada app habria carreras.
create or replace function public.pedidos_recalcular_estado()
returns trigger
language plpgsql
as $$
declare
  v_pedido_id     bigint;
  v_total         integer;
  v_listos        integer;
  v_en_curso      integer;
  v_estado_actual text;
begin
  -- En un DELETE, NEW no esta asignado.
  if tg_op = 'DELETE' then
    v_pedido_id := old.pedido_id;
  else
    v_pedido_id := new.pedido_id;
  end if;

  select estado into v_estado_actual
    from public.pedidos
   where id = v_pedido_id;

  if v_estado_actual not in ('confirmado', 'en_preparacion', 'listo') then
    return null;
  end if;

  select count(*),
         count(*) filter (where estado_item = 'listo'),
         count(*) filter (where estado_item = 'en_preparacion')
    into v_total, v_listos, v_en_curso
    from public.items_pedido
   where pedido_id = v_pedido_id;

  if v_total > 0 and v_listos = v_total then
    update public.pedidos
       set estado = 'listo'
     where id = v_pedido_id
       and estado <> 'listo';

  elsif v_en_curso > 0 or v_listos > 0 then
    update public.pedidos
       set estado = 'en_preparacion'
     where id = v_pedido_id
       and estado = 'confirmado';
  end if;

  return null;
end;
$$;

drop trigger if exists items_pedido_recalcular_pedido on public.items_pedido;
create trigger items_pedido_recalcular_pedido
  after insert or update of estado_item or delete on public.items_pedido
  for each row execute function public.pedidos_recalcular_estado();


-- 4. Permisos y RLS
-- Mismo criterio que el resto del proyecto: abierto a los roles de la API,
-- porque el cliente anonimo no tiene sesion de auth y tambien tiene que pedir.
-- Para produccion habria que atarlo a auth.uid() y al rol.

alter table public.pedidos      enable row level security;
alter table public.items_pedido enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.pedidos      to anon, authenticated;
grant select, insert, update, delete on public.items_pedido to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

drop policy if exists pedidos_lectura on public.pedidos;
create policy pedidos_lectura on public.pedidos
  for select to anon, authenticated using (true);

drop policy if exists pedidos_alta on public.pedidos;
create policy pedidos_alta on public.pedidos
  for insert to anon, authenticated with check (true);

drop policy if exists pedidos_cambio on public.pedidos;
create policy pedidos_cambio on public.pedidos
  for update to anon, authenticated using (true) with check (true);

drop policy if exists pedidos_baja on public.pedidos;
create policy pedidos_baja on public.pedidos
  for delete to anon, authenticated using (true);

drop policy if exists items_pedido_lectura on public.items_pedido;
create policy items_pedido_lectura on public.items_pedido
  for select to anon, authenticated using (true);

drop policy if exists items_pedido_alta on public.items_pedido;
create policy items_pedido_alta on public.items_pedido
  for insert to anon, authenticated with check (true);

drop policy if exists items_pedido_cambio on public.items_pedido;
create policy items_pedido_cambio on public.items_pedido
  for update to anon, authenticated using (true) with check (true);

-- La FK de items_pedido no tiene on delete cascade: para borrar un pedido hay
-- que borrar antes sus items.
drop policy if exists items_pedido_baja on public.items_pedido;
create policy items_pedido_baja on public.items_pedido
  for delete to anon, authenticated using (true);


-- 5. Realtime
-- Sin esto las pantallas de cocina y bar no se actualizan solas.

alter table public.pedidos      replica identity full;
alter table public.items_pedido replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.pedidos;
  exception when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.items_pedido;
  exception when duplicate_object then null;
  end;
end;
$$;


-- 6. Botones del menu
-- Los de cocina y bar existian con ruta NULL.

update public.botones_menu set ruta = '/pedidos/cocina' where clave = 'cocina-pedidos';
update public.botones_menu set ruta = '/pedidos/bar'    where clave = 'bar-pedidos';

insert into public.botones_menu (clave, titulo, icono, ruta, orden, activo)
select 'pedidos-listos', 'Pedidos listos', 'notifications-outline', '/pedidos/listos', 121, true
where not exists (select 1 from public.botones_menu where clave = 'pedidos-listos');

update public.botones_menu
   set ruta = '/pedidos/listos', activo = true
 where clave = 'pedidos-listos';

insert into public.rol_botones (rol_id, boton_id, contexto)
select 4, b.id, 'siempre'
  from public.botones_menu b
 where b.clave = 'pedidos-listos'
   and not exists (
     select 1 from public.rol_botones rb
      where rb.boton_id = b.id and rb.rol_id = 4
   );

-- El dueño y el supervisor tambien pueden mirar cocina y bar.
insert into public.rol_botones (rol_id, boton_id, contexto)
select r.rol_id, b.id, 'siempre'
  from public.botones_menu b
  cross join (values (1), (2)) as r(rol_id)
 where b.clave in ('cocina-pedidos', 'bar-pedidos')
   and not exists (
     select 1 from public.rol_botones rb
      where rb.boton_id = b.id and rb.rol_id = r.rol_id
   );

