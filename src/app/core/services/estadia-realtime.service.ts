import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EstadiaEstado } from '../models/boton-menu.model';

@Injectable({
  providedIn: 'root',
})
export class EstadiaRealtimeService {
  private readonly supabase = inject(SupabaseService);

  private canalSesionAnonima?: ReturnType<
    typeof this.supabase.client.channel
  >;

  private canalUsuarioRegistrado?: ReturnType<
    typeof this.supabase.client.channel
  >;


  suscribirseSesionAnonima(
    sesionId: string,
    onCambio: (estado: EstadiaEstado) => void,
  ): void {
    this.canalSesionAnonima =
      this.supabase.client
        .channel(`estadia-sesion-${sesionId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sesiones_anonimas',
            filter: `id=eq.${sesionId}`,
          },
          (payload) => {
            const estado = (payload.new as {
              estado_estadia?: EstadiaEstado;
            }).estado_estadia;

            if (estado !== undefined) {
              onCambio(estado);
            }
          },
        )
        .subscribe();
  }

  desuscribirseSesionAnonima(): void {
    if (!this.canalSesionAnonima) {
      return;
    }

    void this.supabase.client.removeChannel(
      this.canalSesionAnonima,
    );

    this.canalSesionAnonima = undefined;
  }


  suscribirseUsuarioRegistrado(
    usuarioId: string,
    onCambio: (estado: EstadiaEstado) => void,
  ): void {
    this.canalUsuarioRegistrado =
      this.supabase.client
        .channel(`estadia-usuario-${usuarioId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'usuarios',
            filter: `id=eq.${usuarioId}`,
          },
          (payload) => {
            const estado = (payload.new as {
              estado_estadia?: EstadiaEstado;
            }).estado_estadia;

            if (estado !== undefined) {
              onCambio(estado);
            }
          },
        )
        .subscribe();
  }

  desuscribirseUsuarioRegistrado(): void {
    if (!this.canalUsuarioRegistrado) {
      return;
    }

    void this.supabase.client.removeChannel(
      this.canalUsuarioRegistrado,
    );

    this.canalUsuarioRegistrado = undefined;
  }
}