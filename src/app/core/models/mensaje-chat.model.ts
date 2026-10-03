export interface MensajeChat {
  id: number;
  /** null cuando lo escribe un mozo en la sala general, sin mesa asociada. */
  mesa_id: string | null;
  ocupacion_id: number | null;
  emisor_tipo: string;
  emisor_id: string | null;
  nombre_mozo: string | null;
  mensaje: string;
  leido: boolean;
  created_at: string;
}