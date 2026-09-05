export type TipoMesa = 'vip' | 'estandar' | 'movilidad_reducida';
export type DisponibilidadMesa = 'vacia' | 'ocupada';

export interface Mesa {
  id: string;
  numero: number;
  comensales: number;
  tipo: TipoMesa;
  disponibilidad: DisponibilidadMesa;
  foto_url: string | null;
  qr_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NuevaMesa {
  numero: number;
  comensales: number;
  tipo: TipoMesa;
  fotoWebPath: string;
}

export const TIPOS_MESA: { valor: TipoMesa; etiqueta: string }[] = [
  { valor: 'estandar', etiqueta: 'Estándar' },
  { valor: 'vip', etiqueta: 'VIP' },
  { valor: 'movilidad_reducida', etiqueta: 'Movilidad reducida' },
];

export const DISPONIBILIDADES_MESA: { valor: DisponibilidadMesa; etiqueta: string }[] = [
  { valor: 'vacia', etiqueta: 'Vacía' },
  { valor: 'ocupada', etiqueta: 'Ocupada' },
];
