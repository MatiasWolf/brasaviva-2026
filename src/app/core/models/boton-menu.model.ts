export interface BotonMenu {
  id: number;
  clave: string;
  titulo: string;
  icono: string;
  ruta: string | null;
  orden: number;
  activo: boolean;
  contexto: string;
}

export type EstadiaEstado =
  | 'sin_estadia'
  | 'en_espera'
  | 'mesa_asignada'
  | 'en_mesa'
  | 'pedido_confirmado'
  | 'pedido_entregado';

export interface OpcionEstadia {
  valor: EstadiaEstado;
  etiqueta: string;
}

export const ESTADIA_ESTADOS: OpcionEstadia[] = [
  { valor: 'sin_estadia', etiqueta: 'Sin estadía' },
  { valor: 'en_espera', etiqueta: 'En espera' },
  { valor: 'mesa_asignada', etiqueta: 'Mesa asignada' },
  { valor: 'en_mesa', etiqueta: 'En mesa' },
  { valor: 'pedido_confirmado', etiqueta: 'Pedido confirmado' },
  { valor: 'pedido_entregado', etiqueta: 'Pedido entregado' },
];

export const ROLES_CLIENTE = ['cliente_registrado', 'cliente_anonimo'];
