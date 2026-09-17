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
import { PedidoService } from '../../core/services/pedido.service'; // Ajustá la ruta según tu carpeta
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
  // Inyectamos tus servicios globales
  public pedidoService = inject(PedidoService);
  private router = inject(Router);

  constructor() {
    // Registramos de forma manual los iconos que va a usar el HTML según el estado
    addIcons({ 
      arrowBackOutline, 
      timeOutline, 
      restaurantOutline, 
      closeCircleOutline, 
      checkmarkCircleOutline 
    });
  }

  ngOnInit() {}

  // Ciclo de vida Ionic: Se ejecuta justo antes de que la pantalla se vuelva visible
  ionViewWillEnter() {
    // Prendemos el canal de escucha en tiempo real en Supabase
    this.pedidoService.escucharEstadoPedido();
  }

  // Ciclo de vida Ionic: Se ejecuta cuando el usuario navega a otra pantalla (ej: vuelve al Home)
  ionViewWillLeave() {
    // Apagamos el canal para evitar consumo innecesario de batería y datos en el celu
    this.pedidoService.desconectarseDelPedido();
  }

  /**
   * Método de conveniencia para cuando el cliente presiona "Modificar Pedido" (Punto 13)
   * Redirige internamente a la ruta de la carta
   */
  irAModificarPedido() {
    this.router.navigate(['/menu-productos']); // Ajustá el nombre de tu ruta si es diferente
  }
}

