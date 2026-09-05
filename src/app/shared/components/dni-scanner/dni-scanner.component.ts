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

    const videoEl = this.video();
    if (!videoEl) {
      return;
    }

    this.lector = new BrowserPDF417Reader();

    try {
      this.controles = await this.lector.decodeFromVideoDevice(
        undefined,
        videoEl,
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
      this.mensajeError.set(
        'No se pudo acceder a la cámara. Revisá los permisos e intentá de nuevo.',
      );
    }
  }

  detener(): void {
    this.controles?.stop();
    this.controles = null;
    this.lector = null;
  }
}
