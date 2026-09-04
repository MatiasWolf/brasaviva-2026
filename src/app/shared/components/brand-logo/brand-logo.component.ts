import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { flameOutline } from 'ionicons/icons';

/**
 * Logo de la app, centralizado. Toma los archivos de `src/assets/brand/`
 * (ver el README de esa carpeta). Si el archivo todavía no existe, muestra
 * un ícono de llama como fallback para no romper la pantalla.
 *
 * Uso:
 *   <app-brand-logo [size]="72" />                  <!-- símbolo a color -->
 *   <app-brand-logo variant="mono" [size]="40" />   <!-- 1 tinta -->
 *   <app-brand-logo [size]="48" [spin]="true" />    <!-- girando (spinner) -->
 */
@Component({
  selector: 'app-brand-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="brand-logo"
      [class.brand-logo--spin]="spin()"
      [style.--brand-logo-size.px]="size()"
    >
      @if (falló()) {
        <ion-icon name="flame-outline" aria-hidden="true"></ion-icon>
      } @else {
        <img
          [src]="src()"
          alt="Brasa Viva"
          decoding="async"
          (error)="falló.set(true)"
        />
      }
    </span>
  `,
  styles: [
    `
      .brand-logo {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--brand-logo-size, 64px);
        height: var(--brand-logo-size, 64px);
      }

      .brand-logo img,
      .brand-logo ion-icon {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .brand-logo ion-icon {
        font-size: var(--brand-logo-size, 64px);
        color: #ffd485;
      }

      .brand-logo--spin img,
      .brand-logo--spin ion-icon {
        animation: brand-logo-spin 1.2s linear infinite;
      }

      @keyframes brand-logo-spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  imports: [IonIcon],
})
export class BrandLogoComponent {
  /** Tamaño (ancho y alto) en píxeles. */
  readonly size = input(64);
  /** 'color' = logo.svg · 'mono' = logo-mono.svg (1 tinta). */
  readonly variant = input<'color' | 'mono'>('color');
  /** Anima el logo girando (para pantallas de carga). */
  readonly spin = input(false);

  protected readonly falló = signal(false);

  protected readonly src = computed(() =>
    this.variant() === 'mono'
      ? 'assets/brand/logo-mono.svg'
      : 'assets/brand/logo.svg',
  );

  constructor() {
    addIcons({ flameOutline });
  }
}
