import {
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
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
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonSearchbar,
    SpinnerLogoComponent,
  ],
})
export class ListadoMesasPage implements ViewWillEnter {
  private readonly mesaService = inject(MesaService);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  private readonly porTanda = 8;
  private readonly content = viewChild(IonContent);

  readonly lista = signal<Mesa[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('');
  readonly visibles = signal(this.porTanda);
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

  readonly itemsVisibles = computed(() =>
    this.listaFiltrada().slice(0, this.visibles()),
  );

  readonly hayMas = computed(
    () => this.visibles() < this.listaFiltrada().length,
  );

  constructor() {
    addIcons({
      'add-outline': addOutline,
      'grid-outline': gridOutline,
      'people-outline': peopleOutline,
      'qr-code-outline': qrCodeOutline,
      'close-outline': closeOutline,
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    this.visibles.set(this.porTanda);
    try {
      this.lista.set(await this.mesaService.listarMesas());
    } catch {
      this.error.set('No se pudo cargar el listado de mesas.');
    } finally {
      this.cargando.set(false);
    }
    void this.rellenarSiNoHayScroll();
  }

  filtrar(event: CustomEvent): void {
    this.filtro.set((event.detail as { value?: string }).value ?? '');
    this.visibles.set(this.porTanda);
    void this.rellenarSiNoHayScroll();
  }

  cargarMas(event: InfiniteScrollCustomEvent): void {
    this.visibles.update((n) => n + this.porTanda);
    void event.target.complete();
  }

  private async rellenarSiNoHayScroll(): Promise<void> {
    if (!this.hayMas()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve));

    const content = this.content();
    if (!content) {
      return;
    }
    const el = await content.getScrollElement();
    if (el.scrollHeight <= el.clientHeight && this.hayMas()) {
      this.visibles.update((n) => n + this.porTanda);
      await this.rellenarSiNoHayScroll();
    }
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
