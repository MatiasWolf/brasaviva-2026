import { Usuario } from '../models/usuario.model';
import { SesionAnonima } from '../models/sesion-anonima.model';

export type TipoCliente = 'registrado' | 'anonimo';

export interface ClienteActual {
  tipo: TipoCliente;
  usuario: Usuario | null;
  sesionAnonima: SesionAnonima | null;
}