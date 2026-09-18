import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeCircleOutline,
  peopleOutline,
} from 'ionicons/icons';

import { ClientesPendientesService } from '../../../core/services/clientes-pendientes.service';
import { Usuario } from '../../../core/models/usuario.model';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';
import { MensajeModalService } from '../../../core/services/mensaje-modal.service';
import { traducirErrorSupabase } from '../../../core/utils/traducir-error.util';

@Component({
  selector: 'app-listado-clientes-pendientes',
  templateUrl: './listado-clientes-pendientes.page.html',
  styleUrls: ['./listado-clientes-pendientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonFooter,
    IonIcon,
    SpinnerLogoComponent,
  ],
})
export class ListadoClientesPendientesPage implements ViewWillEnter {
  private readonly clientes = inject(ClientesPendientesService);
  private readonly alertCtrl = inject(AlertController);
  private readonly mensajeModal = inject(MensajeModalService);

  /** Registros por página. Fijo y bajo para que nunca se corte una tarjeta. */
  readonly porPagina = 3;

  readonly lista = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly pagina = signal(1);

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.lista().length / this.porPagina)),
  );

  readonly paginaItems = computed(() => {
    const desde = (this.pagina() - 1) * this.porPagina;
    return this.lista().slice(desde, desde + this.porPagina);
  });

  constructor() {
    addIcons({
      'people-outline': peopleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
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
      this.lista.set(await this.clientes.listarPendientes());
    } catch {
      this.error.set('No se pudo cargar el listado de clientes pendientes.');
    } finally {
      this.cargando.set(false);
    }
  }

  paginaAnterior(): void {
    this.pagina.update((p) => Math.max(1, p - 1));
  }

  paginaSiguiente(): void {
    this.pagina.update((p) => Math.min(this.totalPaginas(), p + 1));
  }

  async confirmarAprobar(cliente: Usuario): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Aprobar cliente',
      message: `¿Aprobar el ingreso de ${cliente.nombre} ${cliente.apellido}? Va a poder iniciar sesión de inmediato.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          handler: () => {
            void this.resolver(cliente, 'aprobar');
          },
        },
      ],
    });
    await alert.present();
  }

  async confirmarRechazar(cliente: Usuario): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Rechazar cliente',
      message: `¿Seguro que querés rechazar a ${cliente.nombre} ${cliente.apellido}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: () => {
            void this.resolver(cliente, 'rechazar');
          },
        },
      ],
    });
    await alert.present();
  }

  private async resolver(
    cliente: Usuario,
    accion: 'aprobar' | 'rechazar',
  ): Promise<void> {
    try {
      if (accion === 'aprobar') {
        await this.clientes.aprobar(cliente.id);
      } else {
        await this.clientes.rechazar(cliente.id);
      }

      this.lista.update((actual) => actual.filter((c) => c.id !== cliente.id));
      if (this.pagina() > this.totalPaginas()) {
        this.pagina.set(this.totalPaginas());
      }

      await this.mostrarToast(
        accion === 'aprobar'
          ? `${cliente.nombre} ya puede ingresar a la app.`
          : 'Cliente rechazado.',
        accion === 'aprobar' ? 'success' : 'danger',
      );
    } catch (err) {
      await this.mostrarToast(
        traducirErrorSupabase(err, 'No se pudo completar la acción.'),
        'danger',
      );
    }
  }

  private async mostrarToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    if (color === 'success') {
      this.mensajeModal.exito(message);
    } else {
      this.mensajeModal.error(message);
    }
  }
}
