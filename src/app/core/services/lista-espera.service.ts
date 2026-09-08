import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';

@Injectable({
  providedIn: 'root',
})
export class ListaEsperaService {

  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private anonymousSessionService = inject(AnonymousSessionService);

  async agregarCliente(
    cantidadPersonas: number,
    tipoMesa: string
  ): Promise<void> {

    const usuario = this.authService.usuarioActual;

    // CLIENTE REGISTRADO
    if (usuario) {

      const { error } =
        await this.supabaseService.client
          .from('lista_espera')
          .insert({
            usuario_id: usuario.id,
            sesion_anonima_id: null,
            nombre: `${usuario.nombre} ${usuario.apellido}`.trim(),
            foto_url: usuario.foto_url,
            cantidad_personas: cantidadPersonas,
            tipo_mesa: tipoMesa,
            estado: 'esperando',
          });

      if (error) {
        console.error(
          'Error al agregar cliente registrado a la lista de espera:',
          error
        );
        throw error;
      }

      return;
    }

    // CLIENTE ANÓNIMO
    const sesion =
      await this.anonymousSessionService.obtenerSesion();

    if (!sesion) {
      throw new Error(
        'No existe una sesión anónima activa.'
      );
    }

    const { error } =
      await this.supabaseService.client
        .from('lista_espera')
        .insert({
          usuario_id: null,
          sesion_anonima_id: sesion.id,
          nombre: `${sesion.nombre} ${sesion.apellido}`.trim(),
          foto_url: sesion.foto_url,
          cantidad_personas: cantidadPersonas,
          tipo_mesa: tipoMesa,
          estado: 'esperando',
        });

    if (error) {
      console.error(
        'Error al agregar cliente anónimo a la lista de espera:',
        error
      );
      throw error;
    }
  }
}