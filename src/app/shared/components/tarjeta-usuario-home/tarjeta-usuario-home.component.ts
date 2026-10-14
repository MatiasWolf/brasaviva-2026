import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cardOutline, personCircleOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tarjeta-usuario-home',
  templateUrl: './tarjeta-usuario-home.component.html',
  styleUrls: ['./tarjeta-usuario-home.component.scss'],
  standalone: true,
  imports: [IonIcon],
})
export class TarjetaUsuarioHomeComponent {
  @Input() nombre = '';
  @Input() apellido = '';
  @Input() fotoUrl: string | null = null;
  @Input() dni: string | null = null;
  @Input() estadoEtiqueta = '';

  constructor() {
    addIcons({ 'person-circle-outline': personCircleOutline, 'card-outline': cardOutline, 'time-outline': timeOutline });
  }
}
