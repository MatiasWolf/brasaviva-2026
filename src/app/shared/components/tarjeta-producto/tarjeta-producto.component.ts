import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, output, signal } from '@angular/core';
import { IonBadge, IonButton, IonCard, IonCardContent, IonIcon, IonLabel } from '@ionic/angular';
import { Producto } from '../../../core/models/pedido.models';
import { addIcons } from 'ionicons';
import { addCircle, arrowBackOutline, arrowForwardOutline, removeCircle, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tarjeta-producto',
  templateUrl: './tarjeta-producto.component.html',
  styleUrls: ['./tarjeta-producto.component.scss'],
  imports: [CommonModule, IonCard, IonCardContent, IonButton, IonIcon, IonBadge],
})
export class TarjetaProductoComponent  implements OnInit {

  // Inputs para recibir el producto y su cantidad actual
  @Input({ required: true }) producto!: Producto;
  @Input() cantidadEnCarrito: number = 0;

  // Outputs para notificar acciones al componente padre
  alAgregar = output<Producto>();
  alRestar = output<number>();

  // Signal LOCAL: controla de forma reactiva e independiente la foto activa de esta tarjeta
  public fotoActivaIndex = signal<number>(0);

  constructor() {
    addIcons({ addCircle, removeCircle, arrowBackOutline, arrowForwardOutline, timeOutline });
  }

  ngOnInit() {}

  /**
   * Retorna la URL de la imagen que corresponde según el índice activo.
   */
  obtenerUrlFoto(): string {
    const fotos = [this.producto.foto_url, this.producto.foto2_url, this.producto.foto3_url];
    return fotos[this.fotoActivaIndex()] || '';
  }

  /**
   * Cambia el índice de la foto de forma circular.
   */
  cambiarFoto(direccion: 'anterior' | 'siguiente') {
    const totalFotos = 3;
    if (direccion === 'siguiente') {
      this.fotoActivaIndex.update(idx => (idx + 1) % totalFotos);
    } else {
      this.fotoActivaIndex.update(idx => (idx - 1 + totalFotos) % totalFotos);
    }
  }

}
