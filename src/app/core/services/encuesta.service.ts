import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';
import { EncuestaPendiente, RespuestaEncuesta } from '../models/encuesta.model';

/**
 * Una estadía queda "pendiente de encuesta" cuando tuvo al menos un pedido
 * entregado y todavía no se registró una respuesta para esa ocupación.
 */
@Injectable({
  providedIn: 'root',
})
export class EncuestaService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly anonymousSession = inject(AnonymousSessionService);

  async obtenerPendientes(): Promise<EncuestaPendiente[]> {
    const usuario = this.auth.usuarioActual;
    const sesionAnonimaId = this.anonymousSession.obtenerIdSesion();

    let consulta = this.supabaseService.client
      .from('ocupaciones_mesa')
      .select('id, fecha_ingreso, mesas(numero), pedidos(estado)');

    if (usuario) {
      consulta = consulta.eq('usuario_id', usuario.id);
    } else if (sesionAnonimaId) {
      consulta = consulta.eq('sesion_anonima_id', sesionAnonimaId);
    } else {
      return [];
    }

    const { data, error } = await consulta;
    if (error) {
      throw error;
    }

    const conPedidoEntregado = (data ?? []).filter((ocupacion: any) =>
      (ocupacion.pedidos ?? []).some((p: any) => p.estado === 'entregado'),
    );

    if (conPedidoEntregado.length === 0) {
      return [];
    }

    const idsCandidatos = conPedidoEntregado.map((o: any) => o.id);

    const { data: yaRespondidas, error: errorEncuestas } =
      await this.supabaseService.client
        .from('encuestas')
        .select('ocupacion_id')
        .in('ocupacion_id', idsCandidatos);

    if (errorEncuestas) {
      throw errorEncuestas;
    }

    const idsRespondidos = new Set(
      (yaRespondidas ?? []).map((e: any) => e.ocupacion_id),
    );

    return conPedidoEntregado
      .filter((o: any) => !idsRespondidos.has(o.id))
      .map((o: any) => ({
        ocupacion_id: o.id,
        mesa_numero: o.mesas?.numero ?? null,
        fecha: o.fecha_ingreso,
      }));
  }

  async responder(
    ocupacionId: number,
    respuesta: RespuestaEncuesta,
  ): Promise<void> {
    const usuario = this.auth.usuarioActual;
    const sesionAnonimaId = this.anonymousSession.obtenerIdSesion();

    const { error } = await this.supabaseService.client
      .from('encuestas')
      .insert({
        ocupacion_id: ocupacionId,
        usuario_id: usuario?.id ?? null,
        sesion_anonima_id: usuario ? null : sesionAnonimaId,
        ...respuesta,
      });

    if (error) {
      throw error;
    }
  }
}
