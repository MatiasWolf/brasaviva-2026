import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  private inicializado = false;

  async inicializar(usuarioId: string): Promise<void> {
    if (this.inicializado || !Capacitor.isNativePlatform()) {
      return;
    }
    this.inicializado = true;

    try {
      let permiso = await PushNotifications.checkPermissions();
      if (permiso.receive === 'prompt') {
        permiso = await PushNotifications.requestPermissions();
      }
      if (permiso.receive !== 'granted') {
        console.warn('Permiso de notificaciones push no concedido.');
        return;
      }

      PushNotifications.addListener('registration', (token: Token) => {
        void this.guardarToken(usuarioId, token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error(
          'Error al registrar el dispositivo para notificaciones:',
          error,
        );
      });

      PushNotifications.addListener(
        'pushNotificationReceived',
        (notificacion: PushNotificationSchema) => {
          void this.mostrarEnPrimerPlano(notificacion);
        },
      );

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (accion: ActionPerformed) => {
          const destino = this.rutaSegunTipo(accion.notification.data);
          if (destino) {
            void this.router.navigateByUrl(destino);
          }
        },
      );

      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (accion) => {
          const destino = this.rutaSegunTipo(accion.notification.extra);
          if (destino) {
            void this.router.navigateByUrl(destino);
          }
        },
      );

      await PushNotifications.register();
    } catch (error) {
      console.error('No se pudo inicializar las notificaciones push:', error);
    }
  }

  /**
   * A dónde lleva cada notificación cuando el usuario la toca.
   * El tipo lo manda la edge function que la originó.
   */
  private rutaSegunTipo(datos: unknown): string | null {
    const tipo = (datos as Record<string, unknown> | null | undefined)?.[
      'tipo'
    ];

    switch (tipo) {
      case 'cliente_pendiente':
        return '/clientes-pendientes';
      case 'pedido_listo':
        // Punto 18: el mozo va directo a la lista de pedidos completos.
        return '/pedidos/listos';
      default:
        return null;
    }
  }

  private async mostrarEnPrimerPlano(
    notificacion: PushNotificationSchema,
  ): Promise<void> {
    try {
      await LocalNotifications.requestPermissions();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: notificacion.title ?? 'Brasa Viva',
            body: notificacion.body ?? '',
            extra: notificacion.data,
          },
        ],
      });
    } catch (error) {
      console.error('No se pudo mostrar la notificación en primer plano:', error);
    }
  }

  private async guardarToken(usuarioId: string, token: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from('push_tokens')
      .upsert(
        { usuario_id: usuarioId, token, plataforma: Capacitor.getPlatform() },
        { onConflict: 'token' },
      );

    if (error) {
      console.error('No se pudo guardar el token de notificaciones:', error);
    }
  }
}
