-- Pedido de prueba para las pantallas de cocina y bar.
-- Crea un pedido ya confirmado con un plato y una bebida sobre la ocupacion de
-- mesa activa mas reciente. Requiere haber corrido antes pedidos.sql.

do $$
declare
  v_ocupacion bigint;
  v_mesa      uuid;
  v_plato     bigint;
  v_bebida    bigint;
  v_pedido    bigint;
begin

  select id, mesa_id
    into v_ocupacion, v_mesa
    from public.ocupaciones_mesa
   where estado = 'activa'
   order by fecha_ingreso desc
   limit 1;

  if v_ocupacion is null then
    raise exception
      'No hay ninguna ocupación de mesa activa. Asigná una mesa primero (punto 10).';
  end if;

  select id into v_plato
    from public.productos
   where categoria_id = 1 and disponible
   limit 1;

  select id into v_bebida
    from public.productos
   where categoria_id = 2 and disponible
   limit 1;

  if v_plato is null or v_bebida is null then
    raise exception
      'Hacen falta al menos un plato y una bebida disponibles (puntos 2 y 3).';
  end if;

  -- Ya confirmado, para saltear el paso del mozo (punto 14).
  insert into public.pedidos (ocupacion_id, estado, importe_total)
  values (v_ocupacion, 'confirmado', 0)
  returning id into v_pedido;

  -- El sector lo pisa el trigger segun la categoria.
  insert into public.items_pedido (pedido_id, producto_id, cantidad, precio_unitario, sector, estado_item)
  select v_pedido, p.id, 2, p.precio, 'cocina', 'pendiente'
    from public.productos p
   where p.id in (v_plato, v_bebida);

  update public.pedidos p
     set importe_total = (
           select coalesce(sum(i.precio_unitario * i.cantidad), 0)
             from public.items_pedido i
            where i.pedido_id = p.id
         )
   where p.id = v_pedido;

  raise notice 'Pedido de prueba % creado para la mesa %.', v_pedido, v_mesa;

end;
$$;

-- Para ver cómo quedó:
select p.id,
       m.numero as mesa,
       p.estado,
       i.sector,
       i.cantidad,
       pr.nombre,
       i.estado_item
  from public.pedidos p
  join public.ocupaciones_mesa o on o.id = p.ocupacion_id
  join public.mesas m            on m.id = o.mesa_id
  join public.items_pedido i     on i.pedido_id = p.id
  join public.productos pr       on pr.id = i.producto_id
 order by p.id desc, i.sector;
