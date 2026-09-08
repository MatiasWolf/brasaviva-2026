import { EstadoUsuario } from './usuario.model';

export interface NuevoEmpleado {
  apellido: string;
  nombre: string;
  dni: string;
  cuil: string;
  correo: string;
  password: string;
  rol: string;
  fotoBase64: string;
}

export interface EmpleadoEditable {
  apellido: string;
  nombre: string;
  dni: string;
  cuil: string;
  rol_id: number;
  estado: EstadoUsuario;
}
