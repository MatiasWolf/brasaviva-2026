import {
  Component,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  ElementRef,
  viewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  IonIcon,
  IonModal
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

import {
  BrowserQRCodeReader,
  IScannerControls
} from '@zxing/browser';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  imports: [
    CommonModule,
    IonModal,
    IonIcon
  ]
})
export class QrScannerComponent implements OnDestroy {

  readonly abierto = input(false);

  readonly escaneado =
    output<string>();

  readonly cerrado =
    output<void>();

  private readonly video =
    viewChild<ElementRef<HTMLVideoElement>>('video');

  readonly mensajeError =
    signal('');

  private lector:
    BrowserQRCodeReader | null = null;

  private controles:
    IScannerControls | null = null;

  private stream:
    MediaStream | null = null;

  constructor() {
    addIcons({
      'close-outline': closeOutline
    });
  }

  ngOnDestroy(): void {
    this.detener();
  }

  cerrar(): void {
    this.detener();
    this.cerrado.emit();
  }

  async iniciar(): Promise<void> {
    this.mensajeError.set('');

    const videoRef = this.video();

    if (!videoRef) {
      return;
    }

    const videoEl = videoRef.nativeElement;

    console.log('QR VIDEO ELEMENT:', videoEl);
    console.log(
      'QR VIDEO constructor:',
      videoEl.constructor.name
    );
    console.log(
      'QR VIDEO tagName:',
      videoEl.tagName
    );
    console.log(
      'QR VIDEO play:',
      typeof videoEl.play
    );

    try {
      console.log(
        'QR: solicitando cámara directamente...'
      );

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment'
            }
          },
          audio: false
        });

      console.log(
        'QR: cámara obtenida:',
        stream
      );

      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;

      await videoEl.play();

      console.log(
        'QR: VIDEO FUNCIONANDO'
      );

      // ---------------------------------
      // ZXing
      // ---------------------------------

      this.lector =
        new BrowserQRCodeReader();

      console.log(
        'QR: iniciando ZXing...'
      );

      this.controles =
        await this.lector.decodeFromVideoElement(
          videoEl,
          (resultado) => {

            if (!resultado) {
              return;
            }

            const texto =
              resultado.getText();

            console.log(
              'QR DETECTADO:',
              texto
            );

            if (!texto) {
              return;
            }

            this.detener();

            this.escaneado.emit(texto);
          }
        );

      console.log(
        'QR: ZXing iniciado correctamente'
      );

    } catch (error) {

      console.error(
        'QR: ERROR:',
        error
      );

      this.mensajeError.set(
        'No se pudo iniciar el lector QR.'
      );
    }
  }

  detener(): void {
    this.controles?.stop();
    this.controles = null;
    this.lector = null;

    const videoRef = this.video();

    if (!videoRef) {
      return;
    }

    const videoEl =
      videoRef.nativeElement;

    const stream =
      videoEl.srcObject as MediaStream | null;

    stream
      ?.getTracks()
      .forEach(track => track.stop());

    videoEl.srcObject = null;
  }
}