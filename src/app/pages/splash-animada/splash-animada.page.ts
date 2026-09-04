import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { BrandLogoComponent } from '../../shared/components/brand-logo/brand-logo.component';

@Component({
  selector: 'app-splash-animada',
  templateUrl: 'splash-animada.page.html',
  styleUrls: ['splash-animada.page.scss'],
  imports: [IonContent, BrandLogoComponent],
})
export class SplashAnimadaPage implements OnInit, OnDestroy {
  readonly nombreGrupo = 'Grupo Brasa Viva';
  readonly integrantes = [
    'Matias Wolf',
    'Martin Moyano',
    'Lujan Miguel',
    'Maximiliano Torrez',
  ];

  private readonly router = inject(Router);
  private timeoutId?: ReturnType<typeof setTimeout>;
  private navegado = false;

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => this.continuar(), 3200);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  saltar(): void {
    this.continuar();
  }

  private continuar(): void {
    if (this.navegado) {
      return;
    }
    this.navegado = true;
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
