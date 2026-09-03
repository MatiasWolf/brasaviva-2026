import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner
} from '@ionic/angular';
import { PlatoService } from '../../core/services/plato.service';
import { Plato } from '../../core/models/plato.model';

@Component({
  selector: 'app-carta',
  templateUrl: './carta.page.html',
  styleUrls: ['./carta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonSpinner
  ]
})
export class CartaPage implements OnInit {

  platos: Plato[] = [];

  cargando = true;

  mensajeError = '';

  constructor(
    private platoService: PlatoService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarPlatos();
  }

  async cargarPlatos() {

    this.cargando = true;
    this.mensajeError = '';

    try {

      this.platos = await this.platoService.listarPlatos();

    } catch (error: any) {

      console.error('CARTA ERROR:', error);
      this.mensajeError = 'No se pudo cargar la carta. Intentá nuevamente.';

    } finally {

      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

}
