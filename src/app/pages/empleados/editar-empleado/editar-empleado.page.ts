import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { createOutline } from 'ionicons/icons';

import { EmpleadosService } from '../../../core/services/empleados.service';
import { Rol } from '../../../core/models/rol.model';
import { EstadoUsuario, Usuario } from '../../../core/models/usuario.model';
import { SpinnerLogoComponent } from '../../../shared/components/spinner-logo/spinner-logo.component';
import { cuilCoherenteConDni } from '../../../core/validators/cuil.validator';

const ESTADOS: EstadoUsuario[] = ['pendiente', 'aprobado', 'rechazado'];

@Component({
  selector: 'app-editar-empleado',
  templateUrl: './editar-empleado.page.html',
  styleUrls: ['./editar-empleado.page.scss'],
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
    SpinnerLogoComponent,
  ],
})
export class EditarEmpleadoPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly empleados = inject(EmpleadosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  readonly estados = ESTADOS;
  readonly roles = signal<Rol[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensajeError = signal('');
  readonly empleado = signal<Usuario | null>(null);

  readonly editarForm: FormGroup = this.fb.group({
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
    rol_id: [null as number | null, [Validators.required]],
    estado: ['aprobado' as EstadoUsuario, [Validators.required]],
  }, { validators: cuilCoherenteConDni() });

  constructor() {
    addIcons({ 'create-outline': createOutline });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/empleados'], { replaceUrl: true });
      return;
    }

    const [roles, empleado] = await Promise.all([
      this.empleados.getRolesAsignables(),
      this.empleados.getEmpleado(id),
    ]);

    this.roles.set(roles);

    if (!empleado) {
      this.mensajeError.set('No se encontró el empleado.');
      this.cargando.set(false);
      return;
    }

    this.empleado.set(empleado);
    this.editarForm.patchValue({
      apellido: empleado.apellido,
      nombre: empleado.nombre,
      dni: empleado.dni ?? '',
      cuil: empleado.cuil ?? '',
      rol_id: empleado.rol_id,
      estado: empleado.estado,
    });
    this.cargando.set(false);
  }

  async guardar(): Promise<void> {
    this.mensajeError.set('');

    if (this.editarForm.invalid) {
      this.editarForm.markAllAsTouched();
      this.mensajeError.set('Revisá los campos marcados.');
      return;
    }

    const empleado = this.empleado();
    if (!empleado) {
      return;
    }

    this.guardando.set(true);
    try {
      await this.empleados.actualizarEmpleado(empleado.id, this.editarForm.value);
      const toast = await this.toastCtrl.create({
        message: 'Cambios guardados.',
        duration: 2500,
        position: 'top',
        color: 'success',
      });
      await toast.present();
      await this.router.navigate(['/empleados'], { replaceUrl: true });
    } catch (error) {
      this.mensajeError.set(
        (error as Error)?.message ?? 'No se pudieron guardar los cambios.',
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
