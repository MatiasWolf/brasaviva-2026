import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController,
  InfiniteScrollCustomEvent,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  createOutline,
  personAddOutline,
  peopleOutline,
  trashOutline,
} from 'ionicons/icons';

import { EmpleadosService } from '../../../core/services/empleados.service';
import { Usuario } from '../../../core/models/usuario.model';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';

@Component({
  selector: 'app-listado-empleados',
  templateUrl: './listado-empleados.page.html',
  styleUrls: ['./listado-empleados.page.scss'],
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
    IonSearchbar,
    SpinnerLogoComponent,
  ],
})
export class ListadoEmpleadosPage implements OnInit {
  private readonly empleados = inject(EmpleadosService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  private readonly porTanda = 6;

  readonly lista = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('');
  readonly visibles = signal(this.porTanda);

  readonly listaFiltrada = computed(() => {
    const q = this.filtro().trim().toLowerCase();
    if (!q) {
      return this.lista();
    }
    return this.lista().filter((e) =>
      `${e.nombre} ${e.apellido} ${e.correo} ${e.roles?.nombre ?? ''}`
        .toLowerCase()
        .includes(q),
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
      'people-outline': peopleOutline,
      'person-add-outline': personAddOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    this.visibles.set(this.porTanda);
    try {
      this.lista.set(await this.empleados.listarEmpleados());
    } catch {
      this.error.set('No se pudo cargar el listado de empleados.');
    } finally {
      this.cargando.set(false);
    }
  }

  filtrar(event: CustomEvent): void {
    this.filtro.set((event.detail as { value?: string }).value ?? '');
    this.visibles.set(this.porTanda);
  }

  cargarMas(event: InfiniteScrollCustomEvent): void {
    this.visibles.update((n) => n + this.porTanda);
    void event.target.complete();
  }

  rolLegible(empleado: Usuario): string {
    return (empleado.roles?.nombre ?? '').replace(/_/g, ' ');
  }

  irAAlta(): void {
    this.router.navigate(['/empleados/nuevo']);
  }

  editar(empleado: Usuario): void {
    this.router.navigate(['/empleados', empleado.id, 'editar']);
  }

  async confirmarEliminar(empleado: Usuario): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar empleado',
      message: `¿Seguro que querés eliminar a ${empleado.nombre} ${empleado.apellido}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.eliminar(empleado);
          },
        },
      ],
    });
    await alert.present();
  }

  private async eliminar(empleado: Usuario): Promise<void> {
    try {
      await this.empleados.eliminarEmpleado(empleado.id);
      this.lista.update((actual) => actual.filter((e) => e.id !== empleado.id));
      await this.mostrarToast('Empleado eliminado.', 'success');
    } catch (err) {
      await this.mostrarToast(
        (err as Error)?.message ?? 'No se pudo eliminar el empleado.',
        'danger',
      );
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
