
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MesaService } from '../../../core/services/mesa.service';
import { Mesa } from '../../../core/models/mesa.model';


import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonButton,
  AlertController,
  IonButtons,
  IonBackButton,
  IonModal,
  IonFooter
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  peopleOutline,
  restaurantOutline,
  timeOutline,
  person,
  closeCircleOutline,
  hourglassOutline,
  logOutOutline,
  checkmarkCircleOutline,
  radioButtonOffOutline,
  addOutline,
  closeOutline,
  gridOutline,
 
} from 'ionicons/icons';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { MensajeModalService } from '../../../core/services/mensaje-modal.service';


interface ClienteListaEspera {
  id: number;
  usuario_id: string | null;
  nombre: string;
  foto_url: string | null;
  cantidad_personas: number;
  tipo_mesa: string;
  estado: string;
  fecha_ingreso: string | null;
  created_at: string;
  sesion_anonima_id: string | null;
}


@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,

  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonButton,
    IonContent,
    IonIcon,
    IonModal,
    IonSearchbar,
    IonCard,
    IonCardContent,
    IonAvatar,
    FormsModule,
    IonFooter,
  ],
})
export class ListaEsperaPage implements OnInit, OnDestroy {

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly alertController = inject(AlertController);
  private readonly mensajeModal = inject(MensajeModalService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly mesaService = inject(MesaService);

  readonly clienteAsignando = signal<ClienteListaEspera | null>(null);
  readonly mesasDisponibles = signal<Mesa[]>([]);
  readonly mesaSeleccionada = signal<Mesa | null>(null);
  readonly cargandoMesas = signal(false);

  private intervalo?: ReturnType<typeof setInterval>;

  mostrarModalExito = false;
  clienteAsignadoExito: ClienteListaEspera | null = null;
  mesaAsignadaExito: Mesa | null = null;

  ahora = Date.now();
  textoBusqueda = '';
  clientes: ClienteListaEspera[] = [];
  cargando = false;
  error = '';
  pagina = signal(1);
  itemsPorPagina = 3; 

  constructor() {

    addIcons({
      peopleOutline,
      restaurantOutline,
      timeOutline,
      person,
      closeCircleOutline,
      hourglassOutline,
      logOutOutline,
      checkmarkCircleOutline,
      radioButtonOffOutline,
      addOutline,
      closeOutline,
      gridOutline,
    });

    // Actualiza el contador de tiempo de espera cada segundo
    this.intervalo = setInterval(() => {
      this.ahora = Date.now();
      this.cdr.detectChanges();
    }, 1000);
  }


  async ngOnInit(): Promise<void> {
    await this.cargarClientes();
  }


  ngOnDestroy(): void {

    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  async cargarClientes(): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      if (!(await this.auth.getSesionActiva())) {
        throw new Error('No hay una sesión activa.');
      }
      const { data, error } = await this.supabase.client
        .from('lista_espera')
        .select(`
          id,
          usuario_id,
          nombre,
          foto_url,
          cantidad_personas,
          estado,
          fecha_ingreso,
          created_at,
          sesion_anonima_id,
          tipo_mesa
        `)
        .eq('estado', 'esperando')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      this.clientes = (data ?? []) as ClienteListaEspera[];
      this.cdr.detectChanges();

    } catch (error) {

      console.error(
        'Error al cargar lista de espera:',
        error
      );
      this.error = 'No se pudo cargar la lista de espera.';
      await this.mostrarToast(
        'No se pudo cargar la lista de espera.',
        'danger'
      );
    } finally {
      this.cargando = false;
    }
  }

  get clientesFiltrados(): ClienteListaEspera[] {
    const texto = (this.textoBusqueda ?? '')
      .trim()
      .toLowerCase();
    if (!texto) {
      return this.clientes;
    }

    return this.clientes.filter(cliente => {
      const nombre = (cliente.nombre ?? '').toLowerCase();

      const tipoMesa = this.tipoMesaLegible(
        cliente.tipo_mesa
      ).toLowerCase();

      const cantidad =
        cliente.cantidad_personas.toString();

      return (
        nombre.includes(texto) ||
        tipoMesa.includes(texto) ||
        cantidad.includes(texto)
      );
    });
  }

  async buscarMesasDisponibles(cliente: ClienteListaEspera): Promise<Mesa[]> {
    const mesas = await this.mesaService.listarMesas();

    return mesas.filter(mesa =>
      mesa.disponibilidad === 'vacia' &&
      mesa.tipo === cliente.tipo_mesa &&
      mesa.comensales >= cliente.cantidad_personas
    );
  }

    async asignarMesa(cliente: ClienteListaEspera): Promise<void> {
    try {
      this.cargandoMesas.set(true);

      const mesasDisponibles = await this.buscarMesasDisponibles(cliente);

      this.mesasDisponibles.set(mesasDisponibles);
      this.mesaSeleccionada.set(null);
      this.clienteAsignando.set(cliente);

    } catch (error) {
      console.error('Error buscando mesas disponibles:', error);

      this.mensajeModal.error('No se pudieron cargar las mesas disponibles.');

    } finally {
      this.cargandoMesas.set(false);
    }
  }

  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada.set(mesa);
  }

 
  async cancelarCliente(
    cliente: ClienteListaEspera
    ): Promise<void> {

    const alert = await this.alertController.create({
      header: 'Cliente se fue',
      message:
        `¿Querés quitar a ${cliente.nombre} de la lista de espera?`,
      cssClass: 'alert-cancelar-cliente',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          role: 'destructive',
          handler: async () => {
             try {
              const { error } =
                await this.supabase.client
                  .from('lista_espera')
                  .update({
                    estado: 'cancelado'
                  })
                  .eq('id', cliente.id);
              if (error) {
                throw error;
              }

              this.clientes =
                this.clientes.filter(
                  c => c.id !== cliente.id
                );
              await this.mostrarToast(
                `${cliente.nombre} fue retirado de la lista.`,
                'success'
              );
            } catch (error) {
              console.error(
                'Error al cancelar cliente:',
                error
              );
              await this.mostrarToast(
                'No se pudo retirar al cliente de la lista.',
                'danger'
              );
            }
          },
        },

      ],
    });

    await alert.present();
  }


  private async quitarDeLista(
    cliente: ClienteListaEspera
  ): Promise<void> {
    try {
      const { error } = await this.supabase.client
        .from('lista_espera')
        .update({
          estado: 'cancelado',
          fecha_ingreso: null,
        })
        .eq('id', cliente.id);
      if (error) {
        throw error;
      }
  
      this.clientes =
        this.clientes.filter(
          c => c.id !== cliente.id
        );
      await this.mostrarToast(
        `${cliente.nombre} fue retirado de la lista.`,
        'success'
      );
    } catch (error) {
      console.error(
        'Error al retirar cliente:',
        error
      );
      await this.mostrarToast(
        'No se pudo retirar al cliente de la lista.',
        'danger'
      );
    }
  }


  tipoMesaLegible(tipo: string): string {
    switch (tipo) {
      case 'estandar':
        return 'Estándar';
      case 'vip':
        return 'VIP';
      case 'movilidad_reducida':
        return 'Movilidad reducida';
      default:
        return tipo;
    }
  }


  tiempoEspera(
    fechaIngreso: string | null
  ): string {
    if (!fechaIngreso) {
      return '00:00:00';
    }
    const ingreso =
      new Date(fechaIngreso).getTime();
    const diferencia =
      Math.max(
        0,
        this.ahora - ingreso
      );
    const segundosTotales =
      Math.floor(diferencia / 1000);
    const horas =
      Math.floor(
        segundosTotales / 3600
      );
    const minutos =
      Math.floor(
        (segundosTotales % 3600) / 60
      );
    const segundos =
      segundosTotales % 60;

    return `${this.formatearNumero(horas)}:${this.formatearNumero(minutos)}:${this.formatearNumero(segundos)}`;
  }

  private formatearNumero(
    numero: number
  ): string {
    return numero
      .toString()
      .padStart(2, '0');
  }



  async confirmarAsignacion(): Promise<void> {
    const cliente = this.clienteAsignando();
    const mesa = this.mesaSeleccionada();

    if (!cliente || !mesa) {
      return;
    }

    try {
      // 1. Crear la ocupación de la mesa
      // Esto vincula al cliente con la mesa asignada.
      const { error: errorOcupacion } =
        await this.supabase.client
          .from('ocupaciones_mesa')
          .insert({
            mesa_id: mesa.id,
            usuario_id: cliente.usuario_id,
            sesion_anonima_id: cliente.sesion_anonima_id,
            lista_espera_id: cliente.id,
            fecha_ingreso: new Date().toISOString(),
            estado: 'asignada',
          });

      if (errorOcupacion) {
        throw errorOcupacion;
      }

      // 2. Marcar la mesa como ocupada
      const { error: errorMesa } =
        await this.supabase.client
          .from('mesas')
          .update({
            disponibilidad: 'ocupada',
            updated_at: new Date().toISOString(),
          })
          .eq('id', mesa.id);

      if (errorMesa) {
        throw errorMesa;
      }

      // 3. Cambiar el estado del cliente en la lista de espera
      const { error: errorLista } =
        await this.supabase.client
          .from('lista_espera')
          .update({
            estado: 'asignado',
          })
          .eq('id', cliente.id);

      if (errorLista) {
        throw errorLista;
      }

      // 4. Actualizar el estado de estadía del cliente
      // Registrado
      if (cliente.usuario_id) {
        const { error: errorUsuario } =
          await this.supabase.client
            .from('usuarios')
            .update({
              estado_estadia: 'mesa_asignada',
            })
            .eq('id', cliente.usuario_id);

        if (errorUsuario) {
          throw errorUsuario;
        }
      }

      // Anónimo
      if (cliente.sesion_anonima_id) {
        const { error: errorSesion } =
          await this.supabase.client
            .from('sesiones_anonimas')
            .update({
              estado_estadia: 'mesa_asignada',
            })
            .eq('id', cliente.sesion_anonima_id);

        if (errorSesion) {
          throw errorSesion;
        }
      }

      // 5. Quitar al cliente de la lista visual
      this.clientes = this.clientes.filter(
        c => c.id !== cliente.id
      );

      // 6. Guardar datos para el modal de éxito
      this.clienteAsignadoExito = cliente;
      this.mesaAsignadaExito = mesa;
      this.mostrarModalExito = true;

    } catch (error) {
      console.error(
        'Error al asignar mesa:',
        error
      );

      await this.mostrarToast(
        'No se pudo asignar la mesa.',
        'danger'
      );
    }
  }


  cerrarAsignacion(): void {
    this.clienteAsignando.set(null);
    this.mesasDisponibles.set([]);
    this.mesaSeleccionada.set(null);
  }

  paginaItems() {
    const inicio = (this.pagina() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;

    return this.clientesFiltrados.slice(inicio, fin);
  }
  
  totalPaginas() {
    return Math.max(
      1,
      Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina)
    );
  }

  paginaAnterior() {
    if (this.pagina() > 1) {
      this.pagina.update(p => p - 1);
    }
  }

  paginaSiguiente() {
    if (this.pagina() < this.totalPaginas()) {
      this.pagina.update(p => p + 1);
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.auth.logout();
      await this.router.navigate(
        ['/login'],
        { replaceUrl: true }
      );
    } catch (error) {
      console.error(
        'Error al cerrar sesión:',
        error
      );
    }
  }


  private async mostrarToast(
    message: string,
    color: 'success' | 'danger'
  ): Promise<void> {
    if (color === 'success') {
      this.mensajeModal.exito(message);
    } else {
      this.mensajeModal.error(message);
    }
  }

  cerrarModalExito(): void {
    this.mostrarModalExito = false;
    this.clienteAsignadoExito = null;
    this.mesaAsignadaExito = null;

    this.cerrarAsignacion();
  }
}

