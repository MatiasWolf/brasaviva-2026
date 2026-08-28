export interface Usuario {
  id: string;
  apellido: string;
  nombre: string;
  dni: string | null;
  cuil: string | null;
  rol_id: number;
  foto_url: string | null;
  estado: string;
  created_at: string;
}