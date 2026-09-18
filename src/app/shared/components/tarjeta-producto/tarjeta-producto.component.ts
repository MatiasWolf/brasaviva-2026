import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, output, signal } from '@angular/core';
import { IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/angular';
import { Producto } from '../../../core/models/pedido.models';
import { addIcons } from 'ionicons';
import { addCircle, arrowBackOutline, arrowForwardOutline, cartOutline, removeCircle, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tarjeta-producto',
  templateUrl: './tarjeta-producto.component.html',
  styleUrls: ['./tarjeta-producto.component.scss'],
  imports: [CommonModule, IonCard, IonCardContent, IonButton, IonIcon],
})
export class TarjetaProductoComponent  implements OnInit {

  // Inputs para recibir el producto y su cantidad actual
  @Input({ required: true }) producto!: Producto;
  @Input() cantidadEnCarrito: number = 0;

  // Outputs para notificar acciones al componente padre
  alAgregar = output<Producto>();
  alRestar = output<number>();

  // Controla la foto activa de la tarjeta
  public fotoActivaIndex = signal<number>(0);

  // Controla si la descripción larga está expandida
  public descripcionExpandida = signal<boolean>(false);

  constructor() {
    addIcons({ addCircle, removeCircle, arrowBackOutline, arrowForwardOutline, timeOutline, cartOutline  });
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
