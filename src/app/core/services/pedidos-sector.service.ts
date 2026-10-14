import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import {
  EstadoPedidoItem,
  PedidoVista,
  SectorPedido,
} from '../models/pedido.models';

/** Estados en los que un pedido sigue siendo trabajo pendiente del local. */
const ESTADOS_EN_CURSO = ['confirmado', 'en_preparacion', 'listo'];

/** La mesa se llega por la ocupacion, y el tiempo por el producto. */
const SELECT_PEDIDO = `
  id,
  ocupacion_id,
  estado,
  importe_total,
  created_at,
  updated_at,
  ocupaciones_mesa!inner (
    id,
    mesa_id,
    mesas!inner ( numero )
  ),
  items_pedido!inner (
    id,
    pedido_id,
    producto_id,
    cantidad,
    precio_unitario,
    sector,
    estado_item,
    created_at,
    productos!inner ( nombre, foto_url, tiempo_preparacion )
  )
`;

interface FilaPedido {
  id: number;
  ocupacion_id: number;
  estado: string;
  importe_total: number;
  created_at: string;
  updated_at: string;
  ocupaciones_mesa: FilaOcupacion | FilaOcupacion[] | null;
  items_pedido: FilaItem[] | null;
}

interface FilaOcupacion {
  id: number;
  mesa_id: string;
  mesas: { numero: number } | { numero: number }[] | null;
}

interface FilaItem {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  sector: string;
  estado_item: string;
  created_at: string;
  productos: FilaProducto | FilaProducto[] | null;
}

interface FilaProducto {
  nombre: string;
  foto_url: string | null;
  tiempo_preparacion: number | null;
}

/** PostgREST devuelve el embebido como objeto o como array según la relación. */
function primero<T>(valor: T | T[] | null): T | null {
  if (Array.isArray(valor)) {
    return valor[0] ?? null;
  }
  return valor;
}

/** Pedidos confirmados, para las pantallas de cocina, bar y mozo. */
@Injectable({
  providedIn: 'root',
})
export class PedidosSectorService {
  private readonly supabaseService = inject(SupabaseService);

  // ---------------------------------------------------------------- lectura

  /** Pedidos en curso que tienen al menos un ítem del sector indicado. */
  async listarPorSector(sector: SectorPedido): Promise<PedidoVista[]> {
    const { data, error } = await this.supabaseService.client
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .in('estado', ESTADOS_EN_CURSO)
      .eq('items_pedido.sector', sector)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return this.mapear(data as unknown as FilaPedido[]);
  }

  /** Punto 18: todo lo que esta en curso, no solo lo que ya esta listo. */
  async listarPendientesDelMozo(): Promise<PedidoVista[]> {
    const { data, error } = await this.supabaseService.client
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .in('estado', ESTADOS_EN_CURSO)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return this.mapear(data as unknown as FilaPedido[]);
  }

  /** Los pedidos de una mesa, sin filtrar por estado, para el cliente. */
  async listarPorOcupacion(ocupacionId: number): Promise<PedidoVista[]> {
    const { data, error } = await this.supabaseService.client
      .from('pedidos')
      .select(SELECT_PEDIDO)
      .eq('ocupacion_id', ocupacionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return this.mapear(data as unknown as FilaPedido[]);
  }

  // ---------------------------------------------------------------- escritura

  /** Cambia el estado de un ítem. El trigger se encarga del estado del pedido. */
  async marcarItem(itemId: number, estado: EstadoPedidoItem): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('items_pedido')
      .update({ estado_item: estado })
      .eq('id', itemId);

    if (error) {
      throw error;
    }
  }

  /** Marca de una vez todos los items del sector: la comanda sale junta. */
  async marcarSector(
    pedidoId: number,
    sector: SectorPedido,
    estado: EstadoPedidoItem,
  ): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('items_pedido')
      .update({ estado_item: estado })
      .eq('pedido_id', pedidoId)
      .eq('sector', sector);

    if (error) {
      throw error;
    }
  }

  /** El mozo ya llevo el pedido a la mesa (punto 19). */
  async marcarEntregado(pedidoId: number): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('pedidos')
      .update({ estado: 'entregado' })
      .eq('id', pedidoId);

    if (error) {
      throw error;
    }
  }

  // ---------------------------------------------------------------- realtime

  /** Avisa cuando cambia un pedido o un item, para recargar la lista. */
  escucharCambios(nombre: string, alCambiar: () => void): RealtimeChannel {
    return this.supabaseService.client
      .channel(nombre)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items_pedido' },
        () => alCambiar(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => alCambiar(),
      )
      .subscribe();
  }

  async cerrarCanal(canal: RealtimeChannel | null): Promise<void> {
    if (canal) {
      await this.supabaseService.client.removeChannel(canal);
    }
  }

  // ---------------------------------------------------------------- privados

  private mapear(filas: FilaPedido[] | null): PedidoVista[] {
    return (filas ?? []).map((fila) => {
      const ocupacion = primero(fila.ocupaciones_mesa);

      return {
        id: fila.id,
        ocupacion_id: fila.ocupacion_id,
        mesa_id: ocupacion?.mesa_id ?? '',
        mesa_numero: primero(ocupacion?.mesas ?? null)?.numero ?? 0,
        estado: fila.estado as PedidoVista['estado'],
        importe_total: Number(fila.importe_total ?? 0),
        created_at: fila.created_at,
        actualizado_at: fila.updated_at ?? fila.created_at,
        items: (fila.items_pedido ?? []).map((item) => {
          const producto = primero(item.productos);

          return {
            id: item.id,
            pedido_id: item.pedido_id,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: Number(item.precio_unitario ?? 0),
            sector: item.sector as SectorPedido,
            estado_item: (item.estado_item ?? 'pendiente') as EstadoPedidoItem,
            created_at: item.created_at,
            producto_nombre: producto?.nombre ?? 'Producto',
            producto_foto_url: producto?.foto_url ?? null,
            tiempo_preparacion: producto?.tiempo_preparacion ?? 0,
          };
        }),
      };
    });
  }
}
