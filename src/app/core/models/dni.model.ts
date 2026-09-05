export type SexoDni = 'M' | 'F' | 'X';

/** Datos que se pueden extraer del código PDF417 del DNI argentino. */
export interface DatosDni {
  apellido: string;
  nombre: string;
  dni: string;
  sexo: SexoDni | null;
  fechaNacimiento: string | null;
  /** CUIL calculado a partir del DNI y el sexo (no viene siempre en el código). */
  cuil: string | null;
}
