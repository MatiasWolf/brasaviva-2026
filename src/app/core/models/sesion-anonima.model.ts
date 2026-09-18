import { EstadiaEstado } from '../models/boton-menu.model';


export interface SesionAnonima {
  id: string;
  nombre: string;
  apellido: string;
  foto_url: string | null;
  rol_id: number;
  estado_estadia: EstadiaEstado;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}