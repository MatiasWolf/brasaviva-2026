import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  ViewWillEnter
} from '@ionic/angular';
import { PlatoService } from '../../core/services/plato.service';
import { Plato } from '../../core/models/plato.model';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { addIcons } from 'ionicons';
import { addOutline, chevronBackOutline, chevronForwardOutline, restaurantOutline } from 'ionicons/icons';

@Component({
  selector: 'app-carta',
  templateUrl: './carta.page.html',
  styleUrls: ['./carta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonBackButton,
    IonContent,
    IonIcon,
    SpinnerLogoComponent
  ]
})
export class CartaPage implements ViewWillEnter {

  platos: Plato[] = [];

  cargando = true;

  mensajeError = '';

  /** Índice de la fotografía visible para cada plato. */
  fotoActual: Record<string, number> = {};

  private readonly platoService = inject(PlatoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'chevron-back-outline': chevronBackOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'restaurant-outline': restaurantOutline
    });
  }

  irAAgregar(): void {
    this.router.navigate(['/agregar-plato']);
  }

  async ionViewWillEnter() {
    await this.cargarPlatos();
  }

  async cargarPlatos() {

    this.cargando = true;
    this.mensajeError = '';

    try {

      this.platos = await this.platoService.listarPlatos();

    } catch (error: any) {

      console.error('CARTA ERROR:', error);
      this.mensajeError = 'No se pudo cargar la carta. Intentá nuevamente.';
      this.vibrar();

    } finally {

      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  /** Fotografías cargadas de un plato, sin los espacios vacíos. */
  fotosDe(plato: Plato): string[] {
    return [plato.foto_url, plato.foto2_url, plato.foto3_url]
      .filter((foto): foto is string => !!foto);
  }

  indiceDe(plato: Plato): number {
    return this.fotoActual[plato.id ?? ''] ?? 0;
  }

  fotoVisible(plato: Plato): string | null {
    const fotos = this.fotosDe(plato);
    return fotos.length ? fotos[this.indiceDe(plato) % fotos.length] : null;
  }

  fotoAnterior(plato: Plato): void {
    const fotos = this.fotosDe(plato);
    if (fotos.length < 2) {
      return;
    }

    const actual = this.indiceDe(plato);
    this.fotoActual[plato.id ?? ''] = (actual - 1 + fotos.length) % fotos.length;
  }

  fotoSiguiente(plato: Plato): void {
    const fotos = this.fotosDe(plato);
    if (fotos.length < 2) {
      return;
    }

    const actual = this.indiceDe(plato);
    this.fotoActual[plato.id ?? ''] = (actual + 1) % fotos.length;
  }

  private vibrar(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  }

}
