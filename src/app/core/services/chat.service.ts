import { Injectable, inject } from '@angular/core';

import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';

import { MensajeChat } from '../models/mensaje-chat.model';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private authService =
    inject(AuthService);

  private anonymousSessionService =
    inject(AnonymousSessionService);

  private canalChatGeneral: any = null;

  private canalChatMesa: any = null;

  constructor(
    private supabase: SupabaseService
  ) {}

  async obtenerMensajesOcupacion(
    ocupacionId: number
  ): Promise<MensajeChat[]> {
    const {
      data,
      error
    } = await this.supabase.client
      .from('mensajes_chat')
      .select('*')
      .eq(
        'ocupacion_id',
        ocupacionId
      )
      .order(
        'created_at',
        {
          ascending: true
        }
      );
    if (error) {
      console.error(
        'ERROR MENSAJES CHAT:',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
    return data ?? [];
  }

  async enviarMensajeMesa(
    mesaId: string,
    ocupacionId: number,
    mensaje: string
  ): Promise<void> {
    const texto = mensaje.trim();
    if (!texto) {
      return;
    }
    const {
      error
    } = await this.supabase.client
      .from('mensajes_chat')
      .insert({
        mesa_id: mesaId,
        ocupacion_id: ocupacionId,
        emisor_tipo: 'mesa',
        emisor_id: null,
        nombre_mozo: null,
        mensaje: texto
      });
    if (error) {
      console.error(
        'ERROR INSERT CHAT:',
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
    console.log(
      'MENSAJE CLIENTE INSERTADO CORRECTAMENTE'
    );
  }


  async enviarRespuestaMozo(
    mesaId: string,
    ocupacionId: number,
    mozoId: string,
    nombreMozo: string,
    mensaje: string
  ): Promise<MensajeChat> {
    const texto =
      mensaje.trim();
    if (!texto) {
      throw new Error(
        'El mensaje no puede estar vacío.'
      );
    }
    const {
      data,
      error
    } = await this.supabase.client
      .from('mensajes_chat')
      .insert({
        mesa_id:
          mesaId,
        ocupacion_id:
          ocupacionId,
        emisor_tipo:
          'mozo',
        emisor_id:
          mozoId,
        nombre_mozo:
          nombreMozo,
        mensaje:
          texto
      })
      .select()
      .single();
    if (error) {
      console.error(
        'Error al responder mensaje:',
        error
      );
      throw error;
    }
    return data;
  }

  async obtenerTodosLosMensajes(): Promise<MensajeChat[]> {
    const {
      data,
      error
    } = await this.supabase.client
      .from('mensajes_chat')
      .select('*')
      .order(
        'created_at',
        {
          ascending: true
        }
      );
    if (error) {
      console.error(
        'Error al obtener los mensajes:',
        error
      );
      throw error;
    }
    return data ?? [];
  }

  async obtenerOcupacionActual(): Promise<{
    id: number;
    mesa_id: string;
  } | null> {
    const usuario =
      this.authService.usuarioActual;
    if (usuario) {
      const {
        data,
        error
      } = await this.supabase.client
        .from('ocupaciones_mesa')
        .select(
          'id, mesa_id'
        )
        .eq(
          'usuario_id',
          usuario.id
        )
        .eq(
          'estado',
          'activa'
        )
        .maybeSingle();
      if (error) {
        console.error(
          'Error al obtener la ocupación actual:',
          error
        );
        throw error;
      }
      return data ?? null;
    }
    const sesion =
      await this.anonymousSessionService
        .obtenerSesion();
    if (!sesion) {
      return null;
    }
    const {
      data,
      error
    } = await this.supabase.client
      .from('ocupaciones_mesa')
      .select(
        'id, mesa_id'
      )
      .eq(
        'sesion_anonima_id',
        sesion.id
      )
      .eq(
        'estado',
        'activa'
      )
      .maybeSingle();
    if (error) {
      console.error(
        'Error al obtener la ocupación actual:',
        error
      );
      throw error;
    }
    return data ?? null;
  }

  async obtenerOcupacionesActivas(): Promise<
    {
      id: number;
      mesa_id: string;
    }[]
  > {
    const {
      data,
      error
    } = await this.supabase.client
      .from('ocupaciones_mesa')
      .select(
        'id, mesa_id'
      )
      .eq(
        'estado',
        'activa'
      );
    if (error) {
      console.error(
        'Error al obtener ocupaciones activas:',
        error
      );
      throw error;
    }
    return data ?? [];
  }

  async obtenerNumeroMesa(
    mesaId: string
  ): Promise<number | null> {
    const {
      data,
      error
    } = await this.supabase.client
      .from('mesas')
      .select(
        'numero'
      )
      .eq(
        'id',
        mesaId
      )
      .maybeSingle();
    if (error) {
      console.error(
        'Error al obtener el número de mesa:',
        error
      );
      throw error;
    }
    return data?.numero ?? null;
  }

  escucharChatGeneral(
    callback: (
      mensaje: MensajeChat
    ) => void
  ): void {
    if (
      this.canalChatGeneral
    ) {
      console.log(
        'CHAT REALTIME MOZOS - ya existe una suscripción'
      );
      return;
    }
    console.log(
      'CHAT REALTIME MOZOS - iniciando suscripción'
    );
    this.canalChatGeneral =
      this.supabase.client
        .channel(
          'chat-general-mozos'
        )
        .on(
          'postgres_changes',
          {
            event:
              'INSERT',
            schema:
              'public',
            table:
              'mensajes_chat'
          },
          (payload) => {
            console.log(
              'CHAT REALTIME MOZOS - nuevo mensaje:',
              payload.new
            );
            callback(
              payload.new as MensajeChat
            );
          }
        )
        .subscribe(
          (status) => {
            console.log(
              'CHAT REALTIME MOZOS - estado:',
              status
            );
          }
        );
  }

  escucharChatOcupacion(
    ocupacionId: number,
    callback: (
      mensaje: MensajeChat
    ) => void
  ): void {
    if (
      this.canalChatMesa
    ) {
      console.log(
        'CHAT REALTIME CLIENTE - cerrando suscripción anterior'
      );
      this.supabase.client.removeChannel(
        this.canalChatMesa
      );
      this.canalChatMesa =
        null;
    }
    console.log(
      'CHAT REALTIME CLIENTE - iniciando suscripción para ocupación:',
      ocupacionId
    );
    this.canalChatMesa =
      this.supabase.client
        .channel(
          `chat-ocupacion-${ocupacionId}`
        )
        .on(
          'postgres_changes',
          {
            event:
              'INSERT',
            schema:
              'public',
            table:
              'mensajes_chat',
            filter:
              `ocupacion_id=eq.${ocupacionId}`
          },
          (payload) => {
            console.log(
              'CHAT REALTIME CLIENTE - nuevo mensaje:',
              payload.new
            );
            callback(
              payload.new as MensajeChat
            );
          }
        )
        .subscribe(
          (status) => {
            console.log(
              'CHAT REALTIME CLIENTE - estado:',
              status
            );
          }
        );
  }

  async obtenerDatosUsuario(
    usuarioId: string
  ): Promise<{
    data: {
      nombre:
        string | null;
      apellido:
        string | null;
    } | null;
    error: any;
  }> {
    const {
      data,
      error
    } = await this.supabase.client
      .from('usuarios')
      .select(
        'nombre, apellido'
      )
      .eq(
        'id',
        usuarioId
      )
      .maybeSingle();
    return {
      data,
      error
    };
  }

  cerrarEscuchaChatGeneral(): void {
    if (
      !this.canalChatGeneral
    ) {

      return;
    }
    this.supabase.client
      .removeChannel(
        this.canalChatGeneral
      );
    this.canalChatGeneral =
      null;
    console.log(
      'CHAT REALTIME MOZOS - suscripción cerrada'
    );
  }

  cerrarEscuchaChatMesa(): void {
    if (
      !this.canalChatMesa
    ) {

      return;
    }
    this.supabase.client
      .removeChannel(
        this.canalChatMesa
      );
    this.canalChatMesa =
      null;
    console.log(
      'CHAT REALTIME CLIENTE - suscripción cerrada'
    );
  }

  cerrarEscuchasChat(): void {
    this.cerrarEscuchaChatGeneral();
    this.cerrarEscuchaChatMesa(); 
  }

}