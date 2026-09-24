import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
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
    IonBackButton,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonSearchbar,
    SpinnerLogoComponent
  ]
})
export class CartaPage implements ViewWillEnter {

  platos: Plato[] = [];

  cargando = true;

  mensajeError = '';

  /** Índice de la fotografía visible para cada plato. */
  fotoActual: Record<string, number> = {};

  /** Registros por página. Con 2, la tarjeta (foto + info) entra completa
   *  y simétrica sin necesitar scroll. */
  readonly porPagina = 2;

  pagina = 1;

  filtro = '';

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
    this.pagina = 1;

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

  get listaFiltrada(): Plato[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) {
      return this.platos;
    }
    return this.platos.filter(p =>
      `${p.nombre} ${p.descripcion}`.toLowerCase().includes(q)
    );
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.listaFiltrada.length / this.porPagina));
  }

  get paginaItems(): Plato[] {
    const desde = (this.pagina - 1) * this.porPagina;
    return this.listaFiltrada.slice(desde, desde + this.porPagina);
  }

  filtrar(event: CustomEvent): void {
    this.filtro = (event.detail as { value?: string }).value ?? '';
    this.pagina = 1;
  }

  paginaAnterior(): void {
    this.pagina = Math.max(1, this.pagina - 1);
  }

  paginaSiguiente(): void {
    this.pagina = Math.min(this.totalPaginas, this.pagina + 1);
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
