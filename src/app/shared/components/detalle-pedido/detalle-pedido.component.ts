import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonIcon, IonFooter, ModalController, IonSpinner } from '@ionic/angular';
import { PedidoService } from '../../../core/services/pedido.service';
import { addIcons } from 'ionicons';
import { addCircle, removeCircle, closeOutline, trashOutline, restaurantOutline } from 'ionicons/icons';

@Component({
  selector: 'app-detalle-pedido',
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonIcon, 
    IonFooter,
    IonSpinner
  ]
})
export class DetallePedidoComponent {
  public pedidoService = inject(PedidoService);
  private modalController = inject(ModalController);

  constructor() {
    addIcons({ addCircle, removeCircle, closeOutline, trashOutline, restaurantOutline });
  }

  cerrar() {
    this.modalController.dismiss();
  }

  async confirmarPedido() {
    // ID de ocupación harcodeado temporalmente en 1 como pide tu método actual
    const resultado = await this.pedidoService.enviarPedidoAConfirmar(1);
    if (resultado && resultado.ok) {
      this.modalController.dismiss({ verificado: true });
    }
  }
}