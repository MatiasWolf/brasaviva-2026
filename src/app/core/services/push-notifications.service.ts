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
          if (accion.notification.data?.['tipo'] === 'cliente_pendiente') {
            void this.router.navigateByUrl('/clientes-pendientes');
          }
        },
      );

      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (accion) => {
          if (accion.notification.extra?.['tipo'] === 'cliente_pendiente') {
            void this.router.navigateByUrl('/clientes-pendientes');
          }
        },
      );

      await PushNotifications.register();
    } catch (error) {
      console.error('No se pudo inicializar las notificaciones push:', error);
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
