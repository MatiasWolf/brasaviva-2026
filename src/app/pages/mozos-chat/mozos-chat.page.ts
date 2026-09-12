import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal
} from '@ionic/angular';

import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { MensajeChat } from '../../core/models/mensaje-chat.model';

@Component({
  selector: 'app-mozos-chat',
  templateUrl: './mozos-chat.page.html',
  styleUrls: ['./mozos-chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonModal
  ]
})
export class MozosChatPage implements OnInit, OnDestroy {

  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  mensajes = signal<MensajeChat[]>([]);

  numerosMesa = signal<Record<string, number>>({});

  mesaSeleccionadaId = signal<string | null>(null);

  mesaSeleccionadaNumero = signal<number | null>(null);

  ocupacionSeleccionadaId = signal<number | null>(null);

  ocupacionesActivas = signal<
    { id: number; mesa_id: string }[]
  >([]);

  nuevoMensaje = signal('');

  cargando = signal(true);

  enviando = signal(false);

  modalAbierto = signal(false);

  @ViewChild('chatContent')
  chatContent?: IonContent;


  mesas = computed(() => {
    const mensajes = this.mensajes();
    const ocupaciones = this.ocupacionesActivas();
    const resultado = new Map<
      string,
      {
        id: string;
        numero: number;
        ocupacionId: number;
        ultimoMensaje: MensajeChat;
        tieneMensajeNuevo: boolean;
      }
    >();
    for (const ocupacion of ocupaciones) {
      const mensajesOcupacion = mensajes
        .filter(
          mensaje =>
            mensaje.mesa_id === ocupacion.mesa_id &&
            mensaje.ocupacion_id === ocupacion.id
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

      if (mensajesOcupacion.length === 0) {
        continue;
      }
      const ultimoMensaje =
        mensajesOcupacion[0];
      const numero =
        this.numerosMesa()[ocupacion.mesa_id];
      if (numero === undefined) {
        continue;
      }
      resultado.set(
        ocupacion.id.toString(),
        {
          id: ocupacion.mesa_id,
          numero,
          ocupacionId: ocupacion.id,
          ultimoMensaje,
          tieneMensajeNuevo:
            ultimoMensaje.emisor_tipo === 'mesa'
        }
      );
    }
    return Array.from(
      resultado.values()
    );
  });


  mesaSeleccionada = computed(() => {
    return this.mesaSeleccionadaNumero();
  });

  mensajesMesaSeleccionada = computed(() => {
    const mesaId =
      this.mesaSeleccionadaId();
    const ocupacionId =
      this.ocupacionSeleccionadaId();
    if (
      !mesaId ||
      ocupacionId === null
    ) {
      return [];
    }
    return this.mensajes().filter(
      mensaje =>
        mensaje.mesa_id === mesaId &&
        mensaje.ocupacion_id === ocupacionId
    );
  });


  async ngOnInit(): Promise<void> {
    await this.cargarChat();
    this.iniciarRealtime();
  }


  ngOnDestroy(): void {
    this.chatService.cerrarEscuchaChatGeneral();
    console.log(
      'MOZOS CHAT - página destruida'
    );
  }


  async cargarChat(): Promise<void> {
    this.cargando.set(true);
    try {
      const [
        mensajes,
        ocupaciones
      ] = await Promise.all([
        this.chatService.obtenerTodosLosMensajes(),
        this.chatService.obtenerOcupacionesActivas()
      ]);
      this.mensajes.set(
        mensajes
      );
      this.ocupacionesActivas.set(
        ocupaciones
      );
      await this.cargarNumerosMesas();

    } catch (error) {
      console.error(
        'MOZOS CHAT - error cargando chat:',
        error
      );
    } finally {
      this.cargando.set(false);
    }
  }


  async cargarNumerosMesas(): Promise<void> {
    const ocupaciones =
      this.ocupacionesActivas();
    const ids = [
      ...new Set(
        ocupaciones.map(
          ocupacion =>
            ocupacion.mesa_id
        )
      )
    ];
    const mapa:
      Record<string, number> = {};
    for (const mesaId of ids) {
      try {
        const numero =
          await this.chatService.obtenerNumeroMesa(
            mesaId
          );
        if (numero !== null) {
          mapa[mesaId] =
            numero;
        }
      } catch (error) {
        console.error(
          'Error al obtener número de mesa:',
          error
        );
      }
    }
    this.numerosMesa.set(
      mapa
    );
    console.log(
      'MOZOS CHAT - números de mesa:',
      mapa
    );
  }


  obtenerNumeroMesa(
    mesaId: string
  ): number | null {

    return (
      this.numerosMesa()[mesaId]
      ?? null
    );
  }

  async seleccionarMesa(
    mesa: {
      id: string;
      numero: number;
      ocupacionId: number;
    }
  ): Promise<void> {
    console.log(
      'MOZOS CHAT - mesa seleccionada:',
      mesa.numero
    );
    console.log(
      'MOZOS CHAT - ocupación seleccionada:',
      mesa.ocupacionId
    );
    this.mesaSeleccionadaId.set(
      mesa.id
    );
    this.mesaSeleccionadaNumero.set(
      mesa.numero
    );
    this.ocupacionSeleccionadaId.set(
      mesa.ocupacionId
    );
    this.modalAbierto.set(
      true
    );
  }



  iniciarRealtime(): void {
    this.chatService.escucharChatGeneral(
      async (
        mensaje: MensajeChat
      ) => {
        console.log(
          'MOZOS CHAT REALTIME - mensaje recibido:',
          mensaje
        );
        const existe =
          this.mensajes().some(
            mensajeExistente =>
              mensajeExistente.id ===
              mensaje.id
          );
        if (existe) {
          console.log(
            'MOZOS CHAT REALTIME - mensaje ya existe'
          );
          return;
        }
        this.mensajes.update(
          mensajes => [
            ...mensajes,
            mensaje
          ]
        );
        if (
          this.numerosMesa()[
            mensaje.mesa_id
          ] === undefined
        ) {
          await this.cargarNumeroMesaRealtime(
            mensaje.mesa_id
          );
        }
        if (
          this.modalAbierto() &&
          this.mesaSeleccionadaId() ===
            mensaje.mesa_id &&
          this.ocupacionSeleccionadaId() ===
            mensaje.ocupacion_id
        ) {
          setTimeout(() => {
            this.scrollAlFinal();
          }, 100);
        }
      }
    );
  }

  cerrarModal(): void {
    this.modalAbierto.set(
      false
    );
    this.nuevoMensaje.set(
      ''
    );
    this.mesaSeleccionadaId.set(
      null
    );
    this.mesaSeleccionadaNumero.set(
      null
    );
    this.ocupacionSeleccionadaId.set(
      null
    );
    console.log(
      'MOZOS CHAT - modal cerrado'
    );
  }

  async cargarNumeroMesaRealtime(
    mesaId: string
  ): Promise<void> {
    try {
      const numero =
        await this.chatService.obtenerNumeroMesa(
          mesaId
        );
      if (
        numero === null
      ) {
        return;
      }
      this.numerosMesa.update(
        mapa => ({
          ...mapa,
          [mesaId]:
            numero
        })
      );
      console.log(
        'MOZOS CHAT REALTIME - número de mesa cargado:',
        numero
      );
    } catch (error) {
      console.error(
        'Error obteniendo número de mesa Realtime:',
        error
      );
    }
  }


  async enviarRespuesta(): Promise<void> {
    const texto =
      this.nuevoMensaje().trim();
    const mesaId =
      this.mesaSeleccionadaId();
    const ocupacionId =
      this.ocupacionSeleccionadaId();
    const mozo =
      this.authService.usuarioActual;
    if (
      !texto ||
      !mesaId ||
      ocupacionId === null ||
      !mozo ||
      this.enviando()
    ) {
      return;
    }
    try {
      this.enviando.set(
        true
      );
      console.log(
        'MOZOS CHAT 5 - enviando respuesta'
      );
      const nombreMozo =
        `${mozo.nombre ?? ''} ${mozo.apellido ?? ''}`
          .trim() || 'Mozo';
      await this.chatService.enviarRespuestaMozo(
        mesaId,
        ocupacionId,
        mozo.id,
        nombreMozo,
        texto
      );
      console.log(
        'MOZOS CHAT 6 - respuesta enviada'
      );
      this.nuevoMensaje.set(
        ''
      );
    } catch (error) {
      console.error(
        'MOZOS CHAT ERROR AL RESPONDER:',
        error
      );
    } finally {
      this.enviando.set(
        false
      );
    }
  }

  esMensajePropio(
    mensaje: MensajeChat
  ): boolean {
    const mozo =
      this.authService.usuarioActual;
    if (
      !mozo ||
      mensaje.emisor_tipo !== 'mozo'
    ) {
      return false;
    }
    return (
      mensaje.emisor_id ===
      mozo.id
    );
  }

  obtenerPreviewMensaje(
    mensaje: MensajeChat | null
  ): string {
    if (!mensaje) {
      return 'Sin mensajes';
    }
    return mensaje.mensaje;
  }


  async scrollAlFinal(): Promise<void> {
    if (!this.chatContent) {
      console.log(
        'CHAT - chatContent no está disponible'
      );
      return;
    }
    await this.chatContent.scrollToBottom(
      300
    );
    console.log(
      'CHAT - scroll realizado al último mensaje'
    );
  }
}