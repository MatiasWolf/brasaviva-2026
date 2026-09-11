import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Usuario } from '../models/usuario.model';

@Injectable({
  providedIn: 'root',
})
export class ClientesPendientesService {
  private readonly supabaseService = inject(SupabaseService);

  async listarPendientes(): Promise<Usuario[]> {
    const { data, error } = await this.supabaseService.client
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al listar clientes pendientes:', error);
      throw error;
    }

    return (data ?? []) as Usuario[];
  }

  async aprobar(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('usuarios')
      .update({ estado: 'aprobado' })
      .eq('id', id);

    if (error) {
      console.error('Error al aprobar al cliente:', error);
      throw new Error(this.traducirError(error));
    }
  }

  async rechazar(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('usuarios')
      .update({ estado: 'rechazado' })
      .eq('id', id);

    if (error) {
      console.error('Error al rechazar al cliente:', error);
      throw new Error(this.traducirError(error));
    }
  }

  private traducirError(error: any): string {
    if (error?.code === '23514') {
      return 'No se pudo actualizar el estado del cliente: la base de datos rechazó el dato. Avisá al administrador.';
    }

    const mensaje = (error?.message ?? '').toLowerCase();

    if (mensaje.includes('row-level security') || mensaje.includes('permission denied')) {
      return 'No tenés permisos para realizar esta acción.';
    }

    if (mensaje.includes('network') || mensaje.includes('fetch')) {
      return 'Sin conexión. Revisá tu internet e intentá de nuevo.';
    }

    return 'No se pudo completar la acción. Intentá nuevamente.';
  }
}
