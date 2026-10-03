export interface Encuesta {
  id: number;
  ocupacion_id: number;
  usuario_id: string | null;
  sesion_anonima_id: string | null;
  puntaje_comida: number;
  puntaje_atencion: number;
  puntaje_general: number;
  comentario: string | null;
  created_at: string;
}

/** Una estadía ya entregada, pendiente de encuesta. */
export interface EncuestaPendiente {
  ocupacion_id: number;
  mesa_numero: number | null;
  fecha: string;
}

export interface RespuestaEncuesta {
  puntaje_comida: number;
  puntaje_atencion: number;
  puntaje_general: number;
  comentario: string | null;
}
