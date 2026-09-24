export interface Producto {
    id: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria_id: number;
    foto_url: string;   
    foto2_url: string;  
    foto3_url: string;  
    tiempo_preparacion: number;
    disponible: boolean;
    created_at: string;
}

export interface ItemCarrito {
    producto: Producto;
    cantidad: number;
}

// Pedidos confirmados (puntos 16, 17 y 18).
// Los nombres siguen a las tablas de Supabase: la columna de estado del item es
// "estado_item", y "pedidos" no guarda la mesa (se llega por ocupaciones_mesa).

/** Lo completa un trigger segun la categoria del producto. */
export type SectorPedido = 'cocina' | 'bar';

export type EstadoPedido =
  | 'pendiente'
  | 'rechazado'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado';

export type EstadoPedidoItem = 'pendiente' | 'en_preparacion' | 'listo';

/** Una línea de la tabla items_pedido. */
export interface PedidoItem {
  id: number;
  pedido_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  sector: SectorPedido;
  estado_item: EstadoPedidoItem;
  created_at: string;
}

/** Una fila de la tabla pedidos. */
export interface Pedido {
  id: number;
  ocupacion_id: number;
  estado: EstadoPedido;
  importe_total: number;
  created_at: string;
  updated_at: string;
}

/** Item con los datos del producto ya resueltos, para la lista. */
export interface ItemPedidoVista extends PedidoItem {
  producto_nombre: string;
  producto_foto_url: string | null;
  tiempo_preparacion: number;
}

/** Un pedido con todo lo que la pantalla necesita, de una sola consulta. */
export interface PedidoVista {
  id: number;
  ocupacion_id: number;
  mesa_id: string;
  mesa_numero: number;
  estado: EstadoPedido;
  importe_total: number;
  created_at: string;
  /** updated_at: para un pedido en "listo", cuando quedo listo. */
  actualizado_at: string;
  items: ItemPedidoVista[];
}

export const ESTADOS_ITEM: Record<EstadoPedidoItem, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  listo: 'Listo',
};

export const ESTADOS_PEDIDO: Record<EstadoPedido, string> = {
  pendiente: 'Esperando al mozo',
  rechazado: 'Rechazado',
  confirmado: 'Confirmado',
  en_preparacion: 'En preparación',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
};

export const SECTORES: Record<SectorPedido, { titulo: string; icono: string }> = {
  cocina: { titulo: 'Pedidos de cocina', icono: 'flame-outline' },
  bar: { titulo: 'Pedidos de bar', icono: 'beer-outline' },
};
