import { Component, inject } from '@angular/core';
import { IonButton, IonIcon, IonModal } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle, checkmarkCircle } from 'ionicons/icons';

import { MensajeModalService } from '../../../core/services/mensaje-modal.service';

@Component({
  selector: 'app-mensaje-modal',
  standalone: true,
  templateUrl: './mensaje-modal.component.html',
  styleUrls: ['./mensaje-modal.component.scss'],
  imports: [IonModal, IonButton, IonIcon],
})
export class MensajeModalComponent {
  readonly servicio = inject(MensajeModalService);

  constructor() {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'alert-circle': alertCircle,
    });
  }
}
