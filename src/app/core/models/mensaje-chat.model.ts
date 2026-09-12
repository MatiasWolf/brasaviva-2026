export interface MensajeChat {
  id: number;
  mesa_id: string;
  ocupacion_id: number | null;
  emisor_tipo: string;
  emisor_id: string | null;
  nombre_mozo: string | null;
  mensaje: string;
  leido: boolean;
  created_at: string;
}