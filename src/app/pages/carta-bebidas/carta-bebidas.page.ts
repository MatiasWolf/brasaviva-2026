import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon
} from '@ionic/angular';
import { BebidaService } from '../../core/services/bebida.service';
import { Bebida } from '../../core/models/bebida.model';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, wineOutline } from 'ionicons/icons';

@Component({
  selector: 'app-carta-bebidas',
  templateUrl: './carta-bebidas.page.html',
  styleUrls: ['./carta-bebidas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonIcon,
    SpinnerLogoComponent
  ]
})
export class CartaBebidasPage implements OnInit {

  bebidas: Bebida[] = [];

  cargando = true;

  mensajeError = '';

  /** Índice de la fotografía visible para cada bebida. */
  fotoActual: Record<string, number> = {};

  constructor(
    private bebidaService: BebidaService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'wine-outline': wineOutline
    });
  }

  async ngOnInit() {
    await this.cargarBebidas();
  }

  async cargarBebidas() {

    this.cargando = true;
    this.mensajeError = '';

    try {

      this.bebidas = await this.bebidaService.listarBebidas();

    } catch (error: any) {

      console.error('CARTA BEBIDAS ERROR:', error);
      this.mensajeError = 'No se pudo cargar la carta. Intentá nuevamente.';
      this.vibrar();

    } finally {

      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  /** Fotografías cargadas de una bebida, sin los espacios vacíos. */
  fotosDe(bebida: Bebida): string[] {
    return [bebida.foto_url, bebida.foto2_url, bebida.foto3_url]
      .filter((foto): foto is string => !!foto);
  }

  indiceDe(bebida: Bebida): number {
    return this.fotoActual[bebida.id ?? ''] ?? 0;
  }

  fotoVisible(bebida: Bebida): string | null {
    const fotos = this.fotosDe(bebida);
    return fotos.length ? fotos[this.indiceDe(bebida) % fotos.length] : null;
  }

  fotoAnterior(bebida: Bebida): void {
    const fotos = this.fotosDe(bebida);
    if (fotos.length < 2) {
      return;
    }

    const actual = this.indiceDe(bebida);
    this.fotoActual[bebida.id ?? ''] = (actual - 1 + fotos.length) % fotos.length;
  }

  fotoSiguiente(bebida: Bebida): void {
    const fotos = this.fotosDe(bebida);
    if (fotos.length < 2) {
      return;
    }

    const actual = this.indiceDe(bebida);
    this.fotoActual[bebida.id ?? ''] = (actual + 1) % fotos.length;
  }

  private vibrar(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  }

}
