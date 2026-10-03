import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSpinner, IonIcon, IonFooter, IonList, IonSegment, IonSegmentButton, ModalController, IonButtons } from '@ionic/angular';
import { PedidoService } from '../../core/services/pedido.service';
import { addIcons } from 'ionicons'; 
import { addCircle, arrowBackOutline, chevronBackOutline, chevronForwardOutline, removeCircle, restaurantOutline, wineOutline } from 'ionicons/icons'; // <-- Importar íconos específicos
import { TarjetaProductoComponent } from '../../shared/components/tarjeta-producto/tarjeta-producto.component';
import { DetallePedidoComponent } from '../../shared/components/detalle-pedido/detalle-pedido.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-menu-productos',
  templateUrl: './menu-productos.page.html',
  styleUrls: ['./menu-productos.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule,
    FormsModule, IonButton, IonSpinner, IonFooter, IonList, TarjetaProductoComponent,
    IonSegment, IonSegmentButton, IonIcon, IonButtons, RouterLink]
})
export class MenuProductosPage implements OnInit {

  public pedidoService = inject(PedidoService);
  private modalController = inject(ModalController);

  // CONTROL DE PESTAÑAS: 1 para Platos, 2 para Bebidas
  public categoriaActiva = signal<number>(1);

  // Filtrado de productos por categoría
  public productosFiltrados = computed(() => {
    return this.pedidoService.productos().filter(p => p.categoria_id === this.categoriaActiva());
  });

  // PAGINADO: 2 tarjetas por página, para que entren completas sin recortarse
  public readonly porPagina = 2;
  public pagina = signal<number>(1);

  public totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.productosFiltrados().length / this.porPagina))
  );

  public paginaItems = computed(() => {
    const desde = (this.pagina() - 1) * this.porPagina;
    return this.productosFiltrados().slice(desde, desde + this.porPagina);
  });

  constructor() {
    addIcons({ addCircle, removeCircle, arrowBackOutline,
              chevronBackOutline, chevronForwardOutline,
              restaurantOutline, wineOutline });
  }

  async ngOnInit() {
    await this.pedidoService.cargarOcupacionMesaId(); 
    this.pedidoService.obtenerProductosMenu();
}

  obtenerCantidad(productoId: number): number {
    const item = this.pedidoService.pedido().find(i => i.producto.id === productoId);
    return item ? item.cantidad : 0;
  }

  cambiarCategoria(event: any) {
    this.categoriaActiva.set(Number(event.detail.value));
    this.pagina.set(1);
  }

  paginaAnterior(): void {
    this.pagina.update(p => Math.max(1, p - 1));
  }

  paginaSiguiente(): void {
    this.pagina.update(p => Math.min(this.totalPaginas(), p + 1));
  }

  async abrirDetallePedido() {
    const modal = await this.modalController.create({
      component: DetallePedidoComponent,
      mode: 'md', 
      cssClass: 'modal-pedido-personalizado' 
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.verificado) {
      console.log('El pedido fue enviado exitosamente al mozo.');
    }
  }

}
