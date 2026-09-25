import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export type TipoJuego =
  | 'memoria'
  | 'reflejos'
  | 'trivia';

export interface JuegoInfo {
  juego: TipoJuego;
  nombre: string;
  descuento: number;
}

export interface ResultadoJuego {
  juego: TipoJuego;
  gano: boolean;
  descuento: number;
  ocupacionMesaId: number;
}

export interface JuegoDescuento {
  id: number;
  usuario_id: string;
  ocupacion_mesa_id: number;
  juego: TipoJuego;
  gano: boolean;
  descuento: number;
  fecha: string;
}

export interface EstadoOportunidad {
  disponible: boolean;
  ocupacionMesaId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class JuegoService {
  private readonly supabaseService = inject(SupabaseService);

  private readonly juegos: JuegoInfo[] = [
    {
      juego: 'memoria',
      nombre: 'Memoria',
      descuento: 10,
    },
    {
      juego: 'reflejos',
      nombre: 'Reflejos',
      descuento: 15,
    },
    {
      juego: 'trivia',
      nombre: 'Trivia',
      descuento: 20,
    },
  ];

  obtenerJuegos(): JuegoInfo[] {
    return [...this.juegos];
  }

  obtenerJuego(juego: TipoJuego): JuegoInfo {
    const informacion = this.juegos.find(item => item.juego === juego);

    if (!informacion) {
      throw new Error(`Juego no encontrado: ${juego}`);
    }

    return informacion;
  }

  obtenerDescuento(juego: TipoJuego): number {
    return this.obtenerJuego(juego).descuento;
  }

  async obtenerOcupacionActual(
    usuarioId: string
  ): Promise<number | null> {
    const { data, error } = await this.supabaseService.client
      .from('ocupaciones_mesa')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activa')
      .order('fecha_ingreso', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener la ocupación actual:', error);
      throw error;
    }

    return data?.id ?? null;
  }

  async obtenerEstadoOportunidad(
    usuarioId: string
  ): Promise<EstadoOportunidad> {
    const ocupacionMesaId = await this.obtenerOcupacionActual(usuarioId);

    if (!ocupacionMesaId) {
      return {
        disponible: false,
        ocupacionMesaId: null,
      };
    }

    const { data, error } = await this.supabaseService.client
      .from('juegos_descuentos')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('ocupacion_mesa_id', ocupacionMesaId)
      .maybeSingle();

    if (error) {
      console.error('Error al consultar la oportunidad de descuento:', error);
      throw error;
    }

    return {
      disponible: !data,
      ocupacionMesaId,
    };
  }

  async registrarResultado(
    usuarioId: string,
    juego: TipoJuego,
    gano: boolean
  ): Promise<ResultadoJuego> {
    const estado = await this.obtenerEstadoOportunidad(usuarioId);

    if (!estado.ocupacionMesaId) {
      throw new Error('No hay una estadía activa para obtener el descuento.');
    }

    if (!estado.disponible) {
      throw new Error('La oportunidad de descuento ya fue utilizada durante esta estadía.');
    }

    const descuento = gano ? this.obtenerDescuento(juego) : 0;

    const { error } = await this.supabaseService.client
      .from('juegos_descuentos')
      .insert({
        usuario_id: usuarioId,
        ocupacion_mesa_id: estado.ocupacionMesaId,
        juego,
        gano,
        descuento,
      });

    if (error) {
      console.error('Error al registrar el resultado del juego:', error);
      throw error;
    }

    return {
      juego,
      gano,
      descuento,
      ocupacionMesaId: estado.ocupacionMesaId,
    };
  }

  async obtenerResultadoActual(
    usuarioId: string
  ): Promise<JuegoDescuento | null> {
    const ocupacionMesaId = await this.obtenerOcupacionActual(usuarioId);

    if (!ocupacionMesaId) {
      return null;
    }

    const { data, error } = await this.supabaseService.client
      .from('juegos_descuentos')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('ocupacion_mesa_id', ocupacionMesaId)
      .maybeSingle();

    if (error) {
      console.error('Error al obtener el resultado del juego:', error);
      throw error;
    }

    return data as JuegoDescuento | null;
  }
}