import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, 
  IonCard, IonCardContent, ToastController, IonSegment, IonSegmentButton, IonButtons 
} from '@ionic/angular';
import { PedidoService } from '../../core/services/pedido.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  checkmarkCircleOutline, closeCircleOutline, alertCircleOutline, 
  hourglassOutline, restaurantOutline, checkmarkDoneCircleOutline, arrowBackOutline, 
  chevronDownOutline,
  chevronUpOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-listado-pedidos',
  templateUrl: './listado-pedidos.page.html',
  styleUrls: ['./listado-pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, 
    IonToolbar, IonButton, IonIcon, IonCard, IonCardContent, 
    IonSegment, IonSegmentButton, IonButtons, RouterLink
  ]
})
export class ListadoPedidosPage {
  public pedidoService = inject(PedidoService);
  private toastController = inject(ToastController);

  // Control de las 3 pestañas del mozo
  public segmentoActivo = signal<string>('nuevos');

  // CONTADORES REACTIVOS COMPUTADOS DESDE LAS SIGNALS DEL SERVICIO
  public cantidadNuevos = computed(() => this.pedidoService.pedidosPendientesMozo().length);
  public cantidadCocina = computed(() => this.pedidoService.pedidosEnPreparacionMozo().length);
  public cantidadListos = computed(() => this.pedidoService.pedidosListosMozo().length);

  constructor() {
    addIcons({ 
      checkmarkCircleOutline, closeCircleOutline, alertCircleOutline, 
      hourglassOutline, restaurantOutline, checkmarkDoneCircleOutline, arrowBackOutline, 
      chevronDownOutline, chevronUpOutline 
    });
  }

  ionViewWillEnter() {
    this.pedidoService.escucharPedidosMozo();
  }

  ionViewWillLeave() {
    this.pedidoService.desconectarseDePedidosMozo();
  }

  cambiarSegmento(event: any) {
    this.segmentoActivo.set(event.detail.value);
  }

  async aceptar(pedido: any) {
    const exito = await this.pedidoService.mozoConfirmaPedido(pedido.id, pedido.ocupaciones_mesa);
    if (exito) {
      this.mostrarToast(`¡Pedido N° ${pedido.id} enviado a Cocina y Bar!`, 'toast-exito');
    } else {
      this.mostrarToast('Error al confirmar el pedido.', 'toast-alerta');
    }
  }

  async rechazandoPedido(pedido: any) {
    const exito = await this.pedidoService.mozoRechazaPedido(pedido.id);
    if (exito) {
      this.mostrarToast(`Pedido N° ${pedido.id} rechazado y vaciado con éxito.`, 'toast-alerta');
    } else {
      this.mostrarToast('Error al rechazar el pedido.', 'toast-alerta');
    }
  }

  async entregar(pedido: any) {
    const exito = await this.pedidoService.mozoEntregaPedidoCompleto(pedido.id, pedido.ocupaciones_mesa);
    if (exito) {
      this.mostrarToast(`¡Pedido de la Mesa ${pedido.ocupaciones_mesa?.mesas?.numero} entregado!`, 'toast-exito');
    } else {
      this.mostrarToast('Error al procesar la entrega.', 'toast-alerta');
    }
  }

  private async mostrarToast(mensaje: string, clasePersonalizada: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      cssClass: `toast-personalizado-mozo ${clasePersonalizada}`
    });
    await toast.present();
  }
}