import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonIcon, IonFooter, ModalController, IonSpinner, ToastController } from '@ionic/angular';
import { PedidoService } from '../../../core/services/pedido.service';
import { Router } from '@angular/router'; 
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
    IonIcon, 
    IonFooter
  ]
})
export class DetallePedidoComponent {
  public pedidoService = inject(PedidoService);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private router = inject(Router);

  constructor() {
    addIcons({ addCircle, removeCircle, closeOutline, trashOutline, restaurantOutline });
  }

  cerrar() {
    this.modalController.dismiss();
  }

  async confirmarPedido() {
    const resultado = await this.pedidoService.enviarPedidoAConfirmar();
    
    if (resultado && resultado.ok) {
      // 1. ÉXITO: Cerrar el modal notificando el estado positivo
      this.modalController.dismiss({ verificado: true });
      
      // 2. NAVIGACIÓN: Redirigir a la pantalla de seguimiento del cliente
      this.router.navigate(['/seguimiento-pedido']); 
      
    } else if (resultado && resultado.productosAgotados && resultado.productosAgotados.length > 0) {
      // 3. ERROR DE DISPONIBILIDAD: Listar los platos que se quitaron automáticamente
      const listaProductos = resultado.productosAgotados.join(', ');
      await this.mostrarToast(
        `Los siguientes productos no están disponibles y se quitaron de tu pedido: ${listaProductos}`,
        'warning'
      );
      // El modal NO se cierra, permitiendo al cliente revisar su carrito actualizado
      
    } else {
      // 4. ERROR GENÉRICO O DE BASE DE DATOS
      await this.mostrarToast(
        'No fue posible enviar el pedido. Por favor, intenta nuevamente.',
        'danger'
      );
    }
  }

  /**
   * Método auxiliar para renderizar mensajes flotantes de Ionic
   */
  private async mostrarToast(mensaje: string, color: 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 4000,
      position: 'bottom',
      color: color,
      cssClass: 'toast-pedido-personalizado',
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}