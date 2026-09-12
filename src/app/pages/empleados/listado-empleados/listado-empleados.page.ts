import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController,
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
  ToastController,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
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
    IonFooter,
    IonIcon,
    IonSearchbar,
    SpinnerLogoComponent,
  ],
})
export class ListadoEmpleadosPage implements ViewWillEnter {
  private readonly empleados = inject(EmpleadosService);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  /** Registros por página. 2 entran completos entre el buscador y el
   *  paginador en cualquier celular, sin necesidad de scroll. */
  readonly porPagina = 2;

  readonly lista = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly filtro = signal('');
  readonly pagina = signal(1);

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

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.listaFiltrada().length / this.porPagina)),
  );

  readonly paginaItems = computed(() => {
    const desde = (this.pagina() - 1) * this.porPagina;
    return this.listaFiltrada().slice(desde, desde + this.porPagina);
  });

  constructor() {
    addIcons({
      'people-outline': peopleOutline,
      'person-add-outline': personAddOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
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
      this.lista.set(await this.empleados.listarEmpleados());
    } catch {
      this.error.set('No se pudo cargar el listado de empleados.');
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
      if (this.pagina() > this.totalPaginas()) {
        this.pagina.set(this.totalPaginas());
      }
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
