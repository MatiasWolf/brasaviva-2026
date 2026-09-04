import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, 
        IonList, IonItem, IonLabel, IonButton, IonBadge, IonSpinner } from '@ionic/angular';
import { PedidoService } from '../../core/services/pedido.service';


@Component({
  selector: 'app-menu-productos',
  templateUrl: './menu-productos.page.html',
  styleUrls: ['./menu-productos.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonButton, IonBadge, IonSpinner]
})
export class MenuProductosPage implements OnInit {

  public pedidoService = inject(PedidoService);

  ngOnInit() {
    this.pedidoService.obtenerProductosMenu();
  }

  obtenerCantidad(productoId: number): number {
    const item = this.pedidoService.pedido().find(i => i.producto.id === productoId);
    return item ? item.cantidad : 0;
  }

}
