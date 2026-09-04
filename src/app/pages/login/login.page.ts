import { Component, OnInit, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonRange,
  IonRow,
  IonToggle,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  flameOutline,
  helpCircleOutline,
  peopleOutline,
  personOutline,
  restaurantOutline,
  storefrontOutline,
  wineOutline,
} from 'ionicons/icons';

import { AuthError, AuthService } from '../../core/services/auth.service';
import { PerfilRapido } from '../../core/models/perfil-rapido.model';
import { SpinnerLogoComponent } from '../../shared/components/spinner-logo/spinner-logo.component';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TitleCasePipe,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonToggle,
    IonLabel,
    IonRange,
    SpinnerLogoComponent,
  ],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;

  readonly isLoading = signal(false);
  readonly sliderValue = signal(0);
  readonly perfilSeleccionadoIndex = signal<number | null>(null);
  readonly perfilesRapidos = signal<PerfilRapido[]>([]);

  readonly ICONOS_ROLES: Record<string, string> = {
    'dueño': 'storefront-outline',
    'supervisor': 'people-outline',
    'metre': 'person-outline',
    'mozo': 'restaurant-outline',
    'cocinero': 'flame-outline',
    'cantinero': 'wine-outline',
    'cliente_registrado': 'person-outline',
    'cliente_anonimo': 'person-outline',
  };

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({
      flameOutline,
      helpCircleOutline,
      peopleOutline,
      personOutline,
      restaurantOutline,
      storefrontOutline,
      wineOutline,
    });

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async ngOnInit(): Promise<void> {
    this.perfilesRapidos.set(await this.auth.getPerfilesRapidos());
  }

  getIconoPorRol(rol: string): string {
    return this.ICONOS_ROLES[(rol ?? '').toLowerCase()] ?? 'help-circle-outline';
  }

  cargarPerfil(index: number, perfil: PerfilRapido): void {
    if (this.perfilSeleccionadoIndex() === index) {
      this.perfilSeleccionadoIndex.set(null);
      this.loginForm.patchValue({ email: '', password: '' });
      return;
    }

    this.perfilSeleccionadoIndex.set(index);
    this.loginForm.patchValue({ email: perfil.correo, password: perfil.clave });
  }

  onSwipeChange(event: CustomEvent): void {
    const value = Number((event.detail as { value: number }).value);

    if (value >= 100) {
      if (!this.isLoading()) {
        this.onLogin();
      }
      setTimeout(() => this.sliderValue.set(0), 400);
    }
  }

  async onLogin(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.vibrarError();
      await this.mostrarError('Por favor verificá el correo y la contraseña.');
      return;
    }

    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;

    try {
      await this.auth.login(email, password);
      await this.router.navigate(['/home'], { replaceUrl: true });
    } catch (error) {
      this.vibrarError();
      const mensaje = error instanceof AuthError ? error.message : this.traducirError(error);
      await this.mostrarError(mensaje);
    } finally {
      this.isLoading.set(false);
      this.sliderValue.set(0);
    }
  }

  irARegistroCliente(): void {
    this.router.navigate(['/registro/registro-cliente']);
  }

  irARegistroAnonimo(): void {
    this.router.navigate(['/registro/cliente-anonimo']);
  }


  private vibrarError(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  }

  private async mostrarError(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'top',
      color: 'danger',
      cssClass: 'error-toast',
    });
    await toast.present();
  }

  private traducirError(error: unknown): string {
    const msg = (error as { message?: string })?.message ?? '';
    if (/invalid login credentials/i.test(msg)) {
      return 'Correo o contraseña incorrectos.';
    }
    if (/email not confirmed/i.test(msg)) {
      return 'Debés confirmar tu correo electrónico antes de ingresar.';
    }
    if (/network|fetch/i.test(msg)) {
      return 'Sin conexión. Revisá tu internet e intentá de nuevo.';
    }
    return 'No pudimos iniciar sesión. Intentá nuevamente.';
  }
}
