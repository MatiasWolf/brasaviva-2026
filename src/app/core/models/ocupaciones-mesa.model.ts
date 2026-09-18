export type EstadoOcupacionMesa =
  | 'asignada'
  | 'activa'
  | 'finalizada';

export interface OcupacionMesa {
  id: number;
  mesa_id: string;
  usuario_id: string | null;
  fecha_ingreso: string;
  fecha_salida: string | null;
  estado: EstadoOcupacionMesa;
  created_at: string;
  lista_espera_id: number;
  sesion_anonima_id: string | null;
}

export interface NuevaOcupacionMesa {
  mesa_id: string;
  usuario_id: string | null;
  fecha_ingreso: string;
  estado: EstadoOcupacionMesa;
  lista_espera_id: number;
  sesion_anonima_id: string | null;
}