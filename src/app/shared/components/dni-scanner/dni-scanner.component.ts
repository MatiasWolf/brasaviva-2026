import { Component, OnDestroy, inject, input, output, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonModal } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { BrowserPDF417Reader, IScannerControls } from '@zxing/browser';

import { DatosDni } from '../../../core/models/dni.model';
import { DniScannerService } from '../../../core/services/dni-scanner.service';

/**
 * Modal con cámara para leer el código PDF417 del dorso del DNI argentino.
 * Uso:
 *   <app-dni-scanner
 *     [abierto]="mostrandoScanner()"
 *     (escaneado)="onEscaneoDni($event)"
 *     (cerrado)="mostrandoScanner.set(false)"
 *   />
 */
@Component({
  selector: 'app-dni-scanner',
  standalone: true,
  templateUrl: './dni-scanner.component.html',
  styleUrls: ['./dni-scanner.component.scss'],
  imports: [CommonModule, IonModal, IonIcon],
})
export class DniScannerComponent implements OnDestroy {
  readonly abierto = input(false);
  readonly escaneado = output<DatosDni>();
  readonly cerrado = output<void>();

  private readonly video = viewChild<HTMLVideoElement>('video');
  private readonly dniScanner = inject(DniScannerService);

  /** Id único por instancia: Ionic mantiene páginas anteriores vivas en el
   *  DOM (para la navegación "atrás"), así que puede haber más de un
   *  <app-dni-scanner> montado a la vez. Con un id fijo, la librería
   *  buscaba por document.getElementById y podía encontrar el <video> de
   *  una instancia vieja y oculta en vez del que está abierto en pantalla. */
  readonly videoElementId = `dni-scanner-video-${crypto.randomUUID()}`;

  readonly mensajeError = signal('');

  private lector: BrowserPDF417Reader | null = null;
  private controles: IScannerControls | null = null;

  constructor() {
    addIcons({ 'close-outline': closeOutline });
  }

  ngOnDestroy(): void {
    this.detener();
  }

  cerrar(): void {
    this.cerrado.emit();
  }

  async iniciar(): Promise<void> {
    this.mensajeError.set('');

    // Por si quedó una cámara abierta de un intento anterior (ej. tocaste
    // "Reintentar" sin que se haya liberado del todo): sin esto, el segundo
    // getUserMedia puede fallar con "cámara en uso" y no abrir nunca.
    this.detener();

    const videoEl = this.video();
    if (!videoEl) {
      return;
    }

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      // getUserMedia solo funciona en HTTPS o localhost. Si esto no es
      // "isSecureContext", el navegador bloquea la cámara sin importar el
      // permiso del sistema operativo, y a veces lo muestra como un error
      // de permisos genérico.
      this.mensajeError.set(
        'El escaneo necesita una conexión segura (HTTPS) o la app instalada. ' +
          'Si estás probando con "ionic serve" abriendo la IP de la compu desde ' +
          'el celular, ahí no va a funcionar: abrí la app empaquetada, o probá ' +
          'desde la misma computadora donde corre "ionic serve".',
      );
      return;
    }

    this.lector = new BrowserPDF417Reader();

    // Constraints explícitas (en vez de decodeFromVideoDevice con
    // deviceId indefinido): pedimos la cámara trasera con la mayor
    // resolución posible. El código PDF417 del dorso del DNI es muy denso
    // — con la resolución "por defecto" que elige el navegador (a veces
    // 640x480) la imagen no tiene detalle suficiente y el lector nunca
    // encuentra el código, aunque la cámara se vea abierta y funcionando.
    //
    // OJO: no agregar constraints "advanced" tipo focusMode/exposureMode
    // acá. Se probó con `advanced: [{ focusMode: 'continuous' }]` y en
    // varios celulares Android el WebView tira "UnknownError:
    // setPhotoOptions failed" al aplicarlas, y la cámara queda colgada
    // sin mostrar ningún frame (no es un error de permisos ni de la app,
    // es un bug conocido de Chromium/WebView con esa API).
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };

    try {
      // Le pasamos el id del <video> (string) en vez de la referencia del
      // elemento: la librería hace un chequeo interno "instanceof
      // HTMLVideoElement" sobre lo que recibe, y ese chequeo falla contra
      // el elemento que Angular resuelve dentro del <ion-modal> (tira
      // "Couldn't get videoElement from videoSource!"). Buscándolo por id
      // con document.getElementById (que es lo que hace la librería
      // cuando le pasás un string) se evita ese problema. El id es único
      // por instancia (ver videoElementId) para no toparse con el <video>
      // de una página anterior cacheada por Ionic.
      this.controles = await this.lector.decodeFromConstraints(
        constraints,
        this.videoElementId,
        (resultado) => {
          if (!resultado) {
            return;
          }
          const datos = this.dniScanner.parsearTextoDni(resultado.getText());
          if (!datos) {
            // se detectó un código pero no tiene forma de DNI: seguimos escaneando
            return;
          }
          this.detener();
          this.escaneado.emit(datos);
        },
      );
    } catch (error) {
      console.error('Error al iniciar la cámara:', error);
      this.mensajeError.set(this.mensajeDeError(error));
    }
  }

  detener(): void {
    this.controles?.stop();
    this.controles = null;
    this.lector = null;
  }

  /** Traduce el DOMException de getUserMedia a un mensaje accionable. */
  private mensajeDeError(error: unknown): string {
    const nombre = (error as { name?: string } | undefined)?.name ?? '';

    switch (nombre) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return (
          'Le negaste (o el sistema le negó) el permiso de cámara a la app. ' +
          'Activalo desde Ajustes del celular → Apps → Brasa Viva → Permisos → ' +
          'Cámara, y volvé a intentar.'
        );
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No se encontró ninguna cámara en este dispositivo.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'La cámara está siendo usada por otra aplicación. Cerrala e intentá de nuevo.';
      case 'OverconstrainedError':
        return 'No se pudo configurar la cámara de este dispositivo para escanear.';
      case 'SecurityError':
        return 'El navegador bloqueó el acceso a la cámara por seguridad (hace falta HTTPS o la app instalada).';
      default:
        return 'No se pudo acceder a la cámara. Revisá los permisos e intentá de nuevo.';
    }
  }
}
