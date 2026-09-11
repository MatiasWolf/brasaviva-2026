export type SexoDni = 'M' | 'F' | 'X';

export interface DatosDni {
  apellido: string;
  nombre: string;
  dni: string;
  sexo: SexoDni | null;
  fechaNacimiento: string | null;
  cuil: string | null;
}
