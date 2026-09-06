import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSpinner, IonIcon, IonFooter, IonList, IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular';
import { PedidoService } from '../../core/services/pedido.service';
import { addIcons } from 'ionicons'; // <-- Importar addIcons
import { addCircle, arrowBackOutline, arrowForwardOutline, removeCircle, restaurantOutline, wineOutline } from 'ionicons/icons'; // <-- Importar íconos específicos
import { TarjetaProductoComponent } from '../../shared/components/tarjeta-producto/tarjeta-producto.component';


@Component({
  selector: 'app-menu-productos',
  templateUrl: './menu-productos.page.html',
  styleUrls: ['./menu-productos.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonButton, IonSpinner, IonFooter, IonList, TarjetaProductoComponent, IonSegment, IonSegmentButton, IonIcon]
})
export class MenuProductosPage implements OnInit {

  public pedidoService = inject(PedidoService);

  // CONTROL DE PESTAÑAS: 1 para Platos, 2 para Bebidas (Alineado a IDs estándar de tu BD)
  public categoriaActiva = signal<number>(1);

  // FILTRADO REACTIVO EN TIEMPO REAL: No ensucia el servicio y mantiene las cards en memoria
  public productosFiltrados = computed(() => {
    return this.pedidoService.productos().filter(p => p.categoria_id === this.categoriaActiva());
  });

  constructor() {
    // Registrar los íconos globalmente para este componente
    addIcons({ addCircle, removeCircle, arrowBackOutline, arrowForwardOutline, 
              restaurantOutline, wineOutline });
  }

  ngOnInit() {
    this.pedidoService.obtenerProductosMenu();
  }

  obtenerCantidad(productoId: number): number {
    const item = this.pedidoService.pedido().find(i => i.producto.id === productoId);
    return item ? item.cantidad : 0;
  }

  cambiarCategoria(event: any) {
    this.categoriaActiva.set(Number(event.detail.value));
  }

}
