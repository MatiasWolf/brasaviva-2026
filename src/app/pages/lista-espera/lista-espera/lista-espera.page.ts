import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonCard,
  IonCardContent,
  IonAvatar,
  IonIcon,
  IonButton,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  restaurantOutline,
  timeOutline,
  person,
  closeCircleOutline,
  hourglassOutline,
} from 'ionicons/icons';

interface ClienteListaEspera {
  id: number;
  nombre: string;
  foto_url: string | null;
  cantidad_personas: number;
  tipo_mesa: string;
  created_at: string;
}

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonChip,
    IonLabel,
    IonCard,
    IonCardContent,
    IonAvatar,
    IonIcon,
    IonButton,
  ],
})
export class ListaEsperaPage implements OnDestroy {
  private intervalo?: ReturnType<typeof setInterval>;
  ahora = Date.now();

  textoBusqueda = '';

  filtroTipo = 'todos';

  clientes: ClienteListaEspera[] = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      foto_url: null,
      cantidad_personas: 4,
      tipo_mesa: 'vip',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      nombre: 'María López',
      foto_url: null,
      cantidad_personas: 2,
      tipo_mesa: 'estandar',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      nombre: 'Luján',
      foto_url: null,
      cantidad_personas: 3,
      tipo_mesa: 'movilidad_reducida',
      created_at: new Date().toISOString(),
    },
  ];

  constructor(
    private alertController: AlertController
  ) {
    addIcons({
      peopleOutline,
      restaurantOutline,
      timeOutline,
      person,
      closeCircleOutline,
      hourglassOutline,
    });
    this.intervalo = setInterval(() => {
      this.ahora = Date.now();
    }, 1000);
  }
    ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }


  get clientesFiltrados(): ClienteListaEspera[] {

    return this.clientes.filter(cliente => {

      const coincideTexto =
        cliente.nombre
          .toLowerCase()
          .includes(this.textoBusqueda.toLowerCase());

      const coincideTipo =
        this.filtroTipo === 'todos' ||
        cliente.tipo_mesa === this.filtroTipo;

      return coincideTexto && coincideTipo;
    });
  }


  filtrarPorTipo(tipo: string): void {

    this.filtroTipo = tipo;

  }


  async asignarMesa(cliente: ClienteListaEspera): Promise<void> {

    console.log('Asignar mesa a:', cliente);

    const alert = await this.alertController.create({
      header: 'Asignar mesa',
      message: `Seleccionar una mesa para ${cliente.nombre}.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Continuar',
          handler: () => {
            console.log('Continuar con asignación de mesa');
          },
        },
      ],
    });

    await alert.present();
  }


  async cancelarCliente(cliente: ClienteListaEspera): Promise<void> {

    const alert = await this.alertController.create({
      header: 'Cliente se fue',
      message: `¿Querés quitar a ${cliente.nombre} de la lista de espera?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          role: 'destructive',
          handler: () => {

            this.clientes =
              this.clientes.filter(c => c.id !== cliente.id);

            console.log(
              'Cliente eliminado de la lista:',
              cliente.nombre
            );

          },
        },
      ],
    });

    await alert.present();
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


  tiempoEspera(fechaIngreso: string): string {
    const ingreso = new Date(fechaIngreso).getTime();

    const diferencia = Math.max(
      0,
      this.ahora - ingreso
    );

    const segundosTotales = Math.floor(
      diferencia / 1000
    );

    const horas = Math.floor(
      segundosTotales / 3600
    );

    const minutos = Math.floor(
      (segundosTotales % 3600) / 60
    );

    const segundos = segundosTotales % 60;

    return `${this.formatearNumero(horas)}:${this.formatearNumero(minutos)}:${this.formatearNumero(segundos)}`;
  }


  private formatearNumero(numero: number): string {
    return numero.toString().padStart(2, '0');
  }

}
