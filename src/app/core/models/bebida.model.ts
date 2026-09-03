export interface Bebida {
  id?: string;
  nombre: string;
  descripcion: string;
  tiempo_preparacion: number;
  precio: number;
  foto_url: string;
  foto2_url: string;
  foto3_url: string;
  disponible?: boolean;
  created_at?: string;
}
