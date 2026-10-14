import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonSpinner 
} from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { PedidoService } from '../../core/services/pedido.service'; 
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  timeOutline, 
  restaurantOutline, 
  closeCircleOutline, 
  checkmarkCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-seguimiento-pedido',
  templateUrl: './seguimiento-pedido.page.html',
  styleUrls: ['./seguimiento-pedido.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    RouterLink
  ]
})
export class SeguimientoPedidoPage implements OnInit {

  public pedidoService = inject(PedidoService);
  private router = inject(Router);

  constructor() {

    addIcons({ 
      arrowBackOutline, 
      timeOutline, 
      restaurantOutline, 
      closeCircleOutline, 
      checkmarkCircleOutline 
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    // Prender el canal de escucha en tiempo real en Supabase
    this.pedidoService.escucharEstadoPedido();
  }

  ionViewWillLeave() {
    // Apagar el canal de escucha
    this.pedidoService.desconectarseDelPedido();
  }

  /**
   * Método para cuando el cliente presiona "Modificar Pedido"
   * Redirige internamente a la ruta de la carta
   */
  irAModificarPedido() {
    //Restaurar los datos del pedido con los datos del respaldo
    this.pedidoService.restaurarPedidoDesdeRespaldo();
    this.router.navigate(['/menu-productos']); 
  }
}

