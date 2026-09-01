import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { restaurantOutline } from 'ionicons/icons';

@Component({
  selector: 'app-spinner-logo',
  template: `
    <div class="spinner-logo" [style.--spinner-size.px]="size">
      <ion-icon name="restaurant-outline"></ion-icon>
    </div>
  `,
  styles: [
    `
      .spinner-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      ion-icon {
        font-size: var(--spinner-size, 32px);
        color: #ffd485;
        animation: spinner-logo-spin 1.2s linear infinite;
      }

      @keyframes spinner-logo-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  imports: [IonIcon],
})
export class SpinnerLogoComponent {
  /** Tamaño del ícono en píxeles. */
  @Input() size = 32;

  constructor() {
    addIcons({ restaurantOutline });
  }
}
