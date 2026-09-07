import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SesionAnonima } from '../models/sesion-anonima.model';
import { EstadiaEstado } from '../models/boton-menu.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AnonymousSessionService {

  private readonly STORAGE_KEY = 'sesion_anonima_id';

  constructor(
    private supabase: SupabaseService,
    private storageService: StorageService
  ) {}

  async crearSesion(
    nombre: string,
    apellido: string,
    fotoUrl: string | null = null
  ): Promise<SesionAnonima> {

    const { data, error } = await this.supabase.client
      .from('sesiones_anonimas')
      .insert({
        nombre,
        apellido,
        foto_url: fotoUrl
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    localStorage.setItem(this.STORAGE_KEY, data.id);

    return data as SesionAnonima;
  }

  obtenerIdSesion(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  async obtenerSesion(): Promise<SesionAnonima | null> {
    const id = this.obtenerIdSesion();
    if (!id) {
      return null;
    }
    const { data, error } = await this.supabase.client
      .from('sesiones_anonimas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }
    return data as SesionAnonima;
  }

  async actualizarFoto(fotoUrl: string): Promise<SesionAnonima> {
    const id = this.obtenerIdSesion();
    if (!id) {
      throw new Error(
        'No existe una sesión anónima activa'
      );
    }
    const { data, error } =
      await this.supabase.client
        .from('sesiones_anonimas')
        .update({
          foto_url: fotoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    if (error) {
      throw error;
    }
    return data as SesionAnonima;
  }
  async actualizarEstado(
    estado: EstadiaEstado
  ): Promise<void> {
    const id = this.obtenerIdSesion();
    if (!id) {
      throw new Error('No existe una sesión anónima activa');
    }
    const { error } = await this.supabase.client
      .from('sesiones_anonimas')
      .update({
        estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) {
      throw error;
    }
  }


  async cerrarSesion(): Promise<void> {
    const id = this.obtenerIdSesion();

    if (!id) {
      return;
    }

    try {

      // Verificamos si el cliente todavía está
      // esperando en la lista de espera.
      const { data, error: errorLista } =
        await this.supabase.client
          .from('lista_espera')
          .select('id')
          .eq('sesion_anonima_id', id)
          .eq('estado', 'esperando')
          .maybeSingle();

      if (errorLista) {
        throw errorLista;
      }

      // Si todavía está esperando:
      // NO borrar sesión
      // NO borrar foto
      // SOLO cerrar sesión localmente.
      if (data) {
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }

      // Si no está en lista de espera,
      // podemos eliminar sus datos.
      await this.storageService.eliminarFoto(id);

      const { error } =
        await this.supabase.client
          .from('sesiones_anonimas')
          .delete()
          .eq('id', id);

      if (error) {
        throw error;
      }

    } catch (error) {

      console.error(
        'Error al cerrar sesión anónima:',
        error
      );

    } finally {

      // En todos los casos se elimina la sesión
      // del dispositivo.
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}