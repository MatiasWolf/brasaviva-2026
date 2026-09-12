import { Component, computed, inject, signal } from '@angular/core';
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
  IonModal,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  gridOutline,
  peopleOutline,
  qrCodeOutline,
} from 'ionicons/icons';

import { MesaService } from '../../../core/services/mesa.service';
import { DisponibilidadMesa, Mesa } from '../../../core/models/mesa.model';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';

@Component({
  selector: 'app-listado-mesas',
  templateUrl: './listado-mesas.page.html',
  styleUrls: ['./listado-mesas.page.scss'],
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
    IonModal,
    IonSearchbar,
    SpinnerLogoComponent,
  ],
})
export class ListadoMesasPage implements ViewWillEnter {
  private readonly mesaService = inject(MesaService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  /** Registros por página. 2 entran completos entre el buscador y el
   *  paginador en cualquier celular, sin necesidad de scroll. */
  readonly porPagina = 2;

  readonly lista = signal<Mesa[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('');
  readonly pagina = signal(1);
  readonly actualizando = signal<string | null>(null);
  readonly mesaQr = signal<Mesa | null>(null);

  readonly listaFiltrada = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    if (!q) {
      return this.lista();
    }
    return this.lista().filter((m) =>
      `${m.numero} ${m.tipo} ${m.disponibilidad}`.toLowerCase().includes(q),
    );
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.listaFiltrada().length / this.porPagina)),
  );

  readonly paginaItems = computed(() => {
    const desde = (this.pagina() - 1) * this.porPagina;
    return this.listaFiltrada().slice(desde, desde + this.porPagina);
  });

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'grid-outline': gridOutline,
      'people-outline': peopleOutline,
      'qr-code-outline': qrCodeOutline,
      'close-outline': closeOutline,
      'chevron-back-outline': chevronBackOutline,
      'chevron-forward-outline': chevronForwardOutline,
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    this.pagina.set(1);
    try {
      this.lista.set(await this.mesaService.listarMesas());
    } catch {
      this.error.set('No se pudo cargar el listado de mesas.');
    } finally {
      this.cargando.set(false);
    }
  }

  filtrar(event: CustomEvent): void {
    this.filtro.set((event.detail as { value?: string }).value ?? '');
    this.pagina.set(1);
  }

  paginaAnterior(): void {
    this.pagina.update((p) => Math.max(1, p - 1));
  }

  paginaSiguiente(): void {
    this.pagina.update((p) => Math.min(this.totalPaginas(), p + 1));
  }

  tipoLegible(mesa: Mesa): string {
    return mesa.tipo.replace(/_/g, ' ');
  }

  irAAlta(): void {
    this.router.navigate(['/mesas/nueva']);
  }

  verQr(mesa: Mesa): void {
    this.mesaQr.set(mesa);
  }

  cerrarQr(): void {
    this.mesaQr.set(null);
  }

  async alternarDisponibilidad(mesa: Mesa): Promise<void> {
    const nueva: DisponibilidadMesa =
      mesa.disponibilidad === 'vacia' ? 'ocupada' : 'vacia';

    this.actualizando.set(mesa.id);
    try {
      await this.mesaService.actualizarDisponibilidad(mesa.id, nueva);
      this.lista.update((actual) =>
        actual.map((m) => (m.id === mesa.id ? { ...m, disponibilidad: nueva } : m)),
      );
    } catch (err) {
      await this.mostrarToast(
        (err as Error)?.message ?? 'No se pudo actualizar la disponibilidad.',
        'danger',
      );
    } finally {
      this.actualizando.set(null);
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
