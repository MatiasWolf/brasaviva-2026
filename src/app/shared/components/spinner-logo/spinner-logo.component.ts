import { Component, Input } from '@angular/core';
import { BrandLogoComponent } from '../brand-logo/brand-logo.component';

@Component({
  selector: 'app-spinner-logo',
  standalone: true,
  template: `
    <div class="spinner-logo">
      <app-brand-logo variant="mono" [size]="size" [spin]="true" />
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
    `,
  ],
  imports: [BrandLogoComponent],
})
export class SpinnerLogoComponent {
  /** Tamaño del logo en píxeles. */
  @Input() size = 32;
}
