
import { Component, computed, inject, signal } from '@angular/core';
import { ListaEsperaService } from '../../core/services/lista-espera.service';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  accessibilityOutline,
  addOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  removeOutline,
  restaurantOutline,
  starOutline,
} from 'ionicons/icons';

type TipoMesa = 'estandar' | 'vip' | 'movilidad_reducida';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
  ],
})
export class ListaEsperaPage {
  private listaEsperaService = inject(ListaEsperaService);

  readonly cantidadComensales = signal(1);

  readonly tipoMesa = signal<TipoMesa | null>(null);

  readonly puedeConfirmar = computed(() =>
    this.cantidadComensales() >= 1 &&
    this.tipoMesa() !== null
  );

  constructor() {
    addIcons({
      accessibilityOutline,
      addOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      removeOutline,
      restaurantOutline,
      starOutline,
    });
  }

  incrementarComensales(): void {
    this.cantidadComensales.update(cantidad => cantidad + 1);
  }

  decrementarComensales(): void {
    this.cantidadComensales.update(cantidad =>
      Math.max(1, cantidad - 1)
    );
  }

  seleccionarMesa(tipo: TipoMesa): void {
    this.tipoMesa.set(tipo);
  }

  async confirmarIngreso(): Promise<void> {
    if (!this.puedeConfirmar()) {
      return;
    }

    try {
      await this.listaEsperaService.agregarCliente(
        this.cantidadComensales(),
        this.tipoMesa()!
      );

      console.log('Cliente agregado a la lista de espera');

    } catch (error) {
      console.error(
        'No se pudo agregar el cliente a la lista de espera:',
        error
      );
    }
  }
}

