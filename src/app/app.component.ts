import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';
import { MensajeModalComponent } from './shared/components/mensaje-modal/mensaje-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MensajeModalComponent],
})
export class AppComponent {
  constructor() {}
}
