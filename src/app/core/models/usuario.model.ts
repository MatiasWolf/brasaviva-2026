import { EstadiaEstado } from './boton-menu.model';

export type EstadoUsuario = 'pendiente' | 'aprobado' | 'rechazado';


export interface Usuario {
  id: string;
  apellido: string;
  nombre: string;
  correo: string;
  dni: string | null;
  cuil: string | null;
  rol_id: number;
  foto_url: string | null;
  estado: EstadoUsuario;
  estado_estadia: EstadiaEstado | null;
  created_at: string;
  roles?: { nombre: string } | null;
}
