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

  private usuarioIdActual: string | null = null;
  private sesionAnonimaIdActual: string | null = null;
  private tokenActual: string | null = null;


  async inicializar(
    usuarioId?: string | null,
    sesionAnonimaId?: string | null,
  ): Promise<void> {

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    this.usuarioIdActual = usuarioId ?? null;
    this.sesionAnonimaIdActual = sesionAnonimaId ?? null;

    if (this.inicializado) {
      if (this.tokenActual) {
        await this.guardarToken(
          this.usuarioIdActual,
          this.sesionAnonimaIdActual,
          this.tokenActual,
        );
      }

      return;
    }

    try {
      let permiso =
        await PushNotifications.checkPermissions();

      if (permiso.receive === 'prompt') {
        permiso =
          await PushNotifications.requestPermissions();
      }

      if (permiso.receive !== 'granted') {
        return;
      }

      PushNotifications.addListener(
        'registration',
        (token: Token) => {
          this.tokenActual = token.value;

          void this.guardarToken(
            this.usuarioIdActual,
            this.sesionAnonimaIdActual,
            token.value,
          );
        },
      );

      PushNotifications.addListener(
        'registrationError',
        (error) => {
          console.error(
            'Error en el registro de notificaciones push:',
            error,
          );
        },
      );

      PushNotifications.addListener(
        'pushNotificationReceived',
        (notificacion: PushNotificationSchema) => {
          void this.mostrarEnPrimerPlano(
            notificacion,
          );
        },
      );

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (accion: ActionPerformed) => {
          const tipo =
            accion.notification.data?.['tipo'];

          if (tipo === 'cliente_pendiente') {
            void this.router.navigateByUrl(
              '/clientes-pendientes',
            );
          }

          if (tipo === 'mesa_asignada') {
            void this.router.navigateByUrl('/home');
          }

          if (tipo === 'consulta_mozo') {
            void this.router.navigateByUrl('/mozos-chat');
          }

          if (tipo === 'respuesta_mozo') {
            void this.router.navigateByUrl('/chat');
          }
        },
      );
      LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (accion) => {
          const tipo =
            accion.notification.extra?.['tipo'];

          if (tipo === 'cliente_pendiente') {
            void this.router.navigateByUrl(
              '/clientes-pendientes',
            );
          }
          if (tipo === 'mesa_asignada') {
            void this.router.navigateByUrl('/home');
          }
          if (tipo === 'consulta_mozo') {
            void this.router.navigateByUrl('/mozos-chat');
          }
          if (tipo === 'respuesta_mozo') {
            void this.router.navigateByUrl('/chat');
          }
        },
      );
      this.inicializado = true;
      await PushNotifications.register();
    } catch (error) {
      console.error(
        'Error al inicializar las notificaciones push:',
        error,
      );
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
      console.error(
        'No se pudo mostrar la notificación en primer plano:',
        error,
      );
    }
  }


  private async guardarToken(
    usuarioId: string | null | undefined,
    sesionAnonimaId: string | null | undefined,
    token: string,
  ): Promise<void> {

    const { error } =
      await this.supabaseService.client
        .from('push_tokens')
        .upsert(
          {
            usuario_id: usuarioId ?? null,
            sesion_anonima_id: sesionAnonimaId ?? null,
            token,
            plataforma: Capacitor.getPlatform(),
          },
          {
            onConflict: 'token',
          },
        );

    if (error) {
      console.error(
        'Error guardando el token de notificaciones:',
        error,
      );
    }
  }

}