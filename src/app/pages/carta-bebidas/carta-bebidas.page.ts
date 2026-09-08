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
import { BebidaService } from '../../core/services/bebida.service';
import { Bebida } from '../../core/models/bebida.model';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';
import { addIcons } from 'ionicons';
import { addOutline, chevronBackOutline, chevronForwardOutline, wineOutline } from 'ionicons/icons';

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
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    IonSearchbar,
    SpinnerLogoComponent
  ]
})
export class CartaBebidasPage implements ViewWillEnter {

  bebidas: Bebida[] = [];

  cargando = true;

  mensajeError = '';

  /** Índice de la fotografía visible para cada bebida. */
  fotoActual: Record<string, number> = {};

  /** Registros por página. Fijo y bajo para que nunca se corte una tarjeta. */
  readonly porPagina = 3;

  pagina = 1;

  filtro = '';

  private readonly bebidaService = inject(BebidaService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'chevron-back-outline': chevronBackOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'wine-outline': wineOutline
    });
  }

  irAAgregar(): void {
    this.router.navigate(['/agregar-bebida']);
  }

  async ionViewWillEnter() {
    await this.cargarBebidas();
  }

  async cargarBebidas() {

    this.cargando = true;
    this.mensajeError = '';
    this.pagina = 1;

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

  get listaFiltrada(): Bebida[] {
    const q = this.filtro.trim().toLowerCase();
    if (!q) {
      return this.bebidas;
    }
    return this.bebidas.filter(b =>
      `${b.nombre} ${b.descripcion}`.toLowerCase().includes(q)
    );
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.listaFiltrada.length / this.porPagina));
  }

  get paginaItems(): Bebida[] {
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
