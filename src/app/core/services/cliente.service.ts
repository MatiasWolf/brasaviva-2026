import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { AnonymousSessionService } from './anonymous-session.service';
import { ROLES_CLIENTE } from '../models/boton-menu.model';
import { ClienteActual } from '../models/cliente.model';
import { StorageService } from './storage.service';



@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private readonly auth = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly anonymousSession = inject(
    AnonymousSessionService
  );

  async obtenerClienteActual(): Promise<ClienteActual | null> {
    const usuario = await this.auth.cargarUsuarioActual();
    if (usuario) {

      const rol = usuario.roles?.nombre ?? '';
      if (!ROLES_CLIENTE.includes(rol)) {
        return null;
      }
      return {
        tipo: 'registrado',
        usuario,
        sesionAnonima: null
      };
    }
    const sesionAnonima =
      await this.anonymousSession.obtenerSesion();
    if (sesionAnonima) {
      return {
        tipo: 'anonimo',
        usuario: null,
        sesionAnonima
      };
    }
    return null;
  }

  async registrarClienteAnonimo(
    nombre: string,
    apellido: string,
    fotoPreview: string
    ): Promise<ClienteActual> {

    await this.auth.logoutLocal();
    const sesion =
        await this.anonymousSession.crearSesion(
        nombre,
        apellido
        );
    const fotoUrl =
        await this.storageService.subirFoto(
        sesion.id,
        fotoPreview
        );

    const sesionActualizada =
        await this.anonymousSession.actualizarFoto(
        fotoUrl
        );

    return {
        tipo: 'anonimo',
        usuario: null,
        sesionAnonima: sesionActualizada
    };
    }

  async esClienteRegistrado(): Promise<boolean> {
    const cliente = await this.obtenerClienteActual();
    return cliente?.tipo === 'registrado';
  }

  async esClienteAnonimo(): Promise<boolean> {
    const cliente = await this.obtenerClienteActual();
    return cliente?.tipo === 'anonimo';
  }
}