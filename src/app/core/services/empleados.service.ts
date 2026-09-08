import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';
import { Rol } from '../models/rol.model';
import { EmpleadoEditable, NuevoEmpleado } from '../models/nuevo-empleado.model';
import { ROLES_CLIENTE } from '../models/boton-menu.model';

export const ROLES_ASIGNABLES = [
  'supervisor',
  'metre',
  'mozo',
  'cocinero',
  'cantinero',
];

@Injectable({
  providedIn: 'root',
})
export class EmpleadosService {
  private supabaseService = inject(SupabaseService);

  async getRolesAsignables(): Promise<Rol[]> {
    const { data, error } = await this.supabaseService.client
      .from('roles')
      .select('id, nombre')
      .in('nombre', ROLES_ASIGNABLES);

    if (error) {
      console.error('Error al obtener roles asignables:', error);
      return [];
    }

    return ((data ?? []) as Rol[]).sort(
      (a, b) =>
        ROLES_ASIGNABLES.indexOf(a.nombre) - ROLES_ASIGNABLES.indexOf(b.nombre),
    );
  }

  async listarEmpleados(): Promise<Usuario[]> {
    const { data, error } = await this.supabaseService.client
      .from('usuarios')
      .select('*, roles(nombre)')
      .order('apellido', { ascending: true });

    if (error) {
      console.error('Error al listar empleados:', error);
      throw error;
    }

    return ((data ?? []) as Usuario[]).filter(
      (u) => !ROLES_CLIENTE.includes(u.roles?.nombre ?? ''),
    );
  }

  async getEmpleado(id: string): Promise<Usuario | null> {
    const { data, error } = await this.supabaseService.client
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener el empleado:', error);
      return null;
    }

    return data as Usuario;
  }

  async crearEmpleado(datos: NuevoEmpleado): Promise<void> {
    const { data, error } = await this.supabaseService.client.functions.invoke(
      'crear-empleado',
      { body: datos },
    );

    if (error) {
      throw new Error(await this.leerErrorFuncion(error));
    }
    if (data?.error) {
      throw new Error(data.error);
    }
  }

  async actualizarEmpleado(
    id: string,
    cambios: EmpleadoEditable,
  ): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('usuarios')
      .update(cambios)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar el empleado:', error);
      throw error;
    }
  }

  async eliminarEmpleado(id: string): Promise<void> {
    const { data, error } = await this.supabaseService.client.functions.invoke(
      'eliminar-empleado',
      { body: { id } },
    );

    if (error) {
      throw new Error(await this.leerErrorFuncion(error));
    }
    if (data?.error) {
      throw new Error(data.error);
    }
  }

  private async leerErrorFuncion(error: unknown): Promise<string> {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const cuerpo = await ctx.json();
        if (cuerpo?.error) {
          return cuerpo.error;
        }
      } catch {
      }
    }
    return (error as Error)?.message ?? 'No se pudo completar la operación.';
  }
}
