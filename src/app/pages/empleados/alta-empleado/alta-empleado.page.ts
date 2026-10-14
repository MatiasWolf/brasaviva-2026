import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, personAddOutline, scanOutline } from 'ionicons/icons';

import { EmpleadosService } from '../../../core/services/empleados.service';
import { CameraService } from '../../../core/services/camera.service';
import { Rol } from '../../../core/models/rol.model';
import { cuilCoherenteConDni } from '../../../core/validators/cuil.validator';
import { DniScannerComponent } from '../../../shared/components/dni-scanner/dni-scanner.component';
import { DatosDni } from '../../../core/models/dni.model';
import { MensajeModalService } from '../../../core/services/mensaje-modal.service';
import { traducirErrorSupabase } from '../../../core/utils/traducir-error.util';

@Component({
  selector: 'app-alta-empleado',
  templateUrl: './alta-empleado.page.html',
  styleUrls: ['./alta-empleado.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonContent,
    IonFooter,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    DniScannerComponent,
  ],
})
export class AltaEmpleadoPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empleados = inject(EmpleadosService);
  private readonly cameraService = inject(CameraService);
  private readonly router = inject(Router);
  private readonly mensajeModal = inject(MensajeModalService);

  readonly altaForm: FormGroup;

  readonly roles = signal<Rol[]>([]);
  readonly fotoPreview = signal<string | null>(null);
  readonly enviando = signal(false);
  readonly mensajeError = signal('');
  readonly mostrandoScanner = signal(false);

  constructor() {
    addIcons({
      'person-add-outline': personAddOutline,
      'camera-outline': cameraOutline,
      'scan-outline': scanOutline,
    });

    this.altaForm = this.fb.group(
      {
        apellido: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        nombre: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
          ],
        ],
        dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
        cuil: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
        correo: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[^\s@]+@[^\s@]+\.com$/),
            Validators.maxLength(100),
          ],
        ],
        rol: ['', [Validators.required]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(50),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: [this.passwordsIguales, cuilCoherenteConDni()] },
    );
  }

  async ngOnInit(): Promise<void> {
    this.roles.set(await this.empleados.getRolesAsignables());
  }

  escanearDni(): void {
    this.mensajeError.set('');
    this.mostrandoScanner.set(true);
  }

  onDniEscaneado(datos: DatosDni): void {
    this.mostrandoScanner.set(false);

    const cambios: Record<string, string> = {
      apellido: datos.apellido,
      nombre: datos.nombre,
      dni: datos.dni,
    };
    if (datos.cuil) {
      cambios['cuil'] = datos.cuil;
    }

    this.altaForm.patchValue(cambios);
    Object.keys(cambios).forEach((campo) =>
      this.altaForm.get(campo)?.markAsDirty(),
    );
  }

  async tomarFoto(): Promise<void> {
    this.mensajeError.set('');
    try {
      const foto = await this.cameraService.tomarFoto();
      if (!foto.webPath) {
        return;
      }
      this.fotoPreview.set(await this.aDataUrl(foto.webPath));
    } catch (error) {
      console.error('Error al tomar la foto:', error);
      this.mostrarError('No se pudo obtener la foto. Intentá nuevamente.');
    }
  }

  async guardar(): Promise<void> {
    this.mensajeError.set('');

    if (this.altaForm.invalid) {
      this.altaForm.markAllAsTouched();
      this.mostrarError('Completá correctamente todos los campos.');
      return;
    }
    if (!this.fotoPreview()) {
      this.mostrarError('La foto de perfil es obligatoria.');
      return;
    }

    const { apellido, nombre, dni, cuil, correo, rol, password } =
      this.altaForm.value;

    this.enviando.set(true);
    try {
      await this.empleados.crearEmpleado({
        apellido,
        nombre,
        dni,
        cuil,
        correo,
        rol,
        password,
        fotoBase64: this.fotoPreview()!,
      });
      this.mensajeModal.exito(
        'La cuenta quedó activa. Compartile al empleado su correo y la contraseña para que pueda ingresar.',
        '¡Empleado creado!',
      );
      await this.router.navigate(['/empleados'], { replaceUrl: true });
    } catch (error) {
      console.error('ALTA EMPLEADO ERROR:', error);
      this.mostrarError(
        traducirErrorSupabase(error, 'No se pudo dar de alta al empleado. Intentá nuevamente.'),
      );
    } finally {
      this.enviando.set(false);
    }
  }

  private mostrarError(mensaje: string): void {
    this.mensajeError.set(mensaje);
    this.mensajeModal.error(mensaje);
  }

  private passwordsIguales(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (!password || !confirmPassword) {
      return null;
    }
    return password === confirmPassword ? null : { passwordsNoCoinciden: true };
  }

  private async aDataUrl(webPath: string): Promise<string> {
    const blob = await (await fetch(webPath)).blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}
