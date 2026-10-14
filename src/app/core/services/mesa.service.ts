import { Injectable, inject } from '@angular/core';
import * as QRCode from 'qrcode';
import { SupabaseService } from './supabase.service';
import {
  DisponibilidadMesa,
  Mesa,
  NuevaMesa,
} from '../models/mesa.model';

const TABLA = 'mesas';
const BUCKET = 'mesas-fotos';

@Injectable({
  providedIn: 'root',
})
export class MesaService {
  private readonly supabaseService = inject(SupabaseService);

  async listarMesas(): Promise<Mesa[]> {
    const { data, error } = await this.supabaseService.client
      .from(TABLA)
      .select('*')
      .order('numero', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as Mesa[];
  }

  /** true si ya existe una mesa con ese número (para validar antes de guardar). */
  async existeNumero(numero: number): Promise<boolean> {
    const { data, error } = await this.supabaseService.client
      .from(TABLA)
      .select('id')
      .eq('numero', numero)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return !!data;
  }

  async crearMesa(datos: NuevaMesa): Promise<Mesa> {
    const id = crypto.randomUUID();

    const fotoUrl = await this.subirImagen(
      `${id}.jpg`,
      await this.webPathABlob(datos.fotoWebPath),
    );

    const qrUrl = await this.generarYSubirQr(id);

    const { data, error } = await this.supabaseService.client
      .from(TABLA)
      .insert({
        id,
        numero: datos.numero,
        comensales: datos.comensales,
        tipo: datos.tipo,
        disponibilidad: 'vacia',
        foto_url: fotoUrl,
        qr_url: qrUrl,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Mesa;
  }

  async actualizarDisponibilidad(
    id: string,
    disponibilidad: DisponibilidadMesa,
  ): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(TABLA)
      .update({ disponibilidad, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async eliminarMesa(id: string): Promise<void> {
    const { error } = await this.supabaseService.client
      .from(TABLA)
      .delete()
      .eq('id', id);

    if (error) {
      // 23503 = viola una FK (ej. la mesa tiene ocupaciones registradas).
      if (error.code === '23503') {
        throw new Error(
          'No se puede eliminar: esta mesa tiene ocupaciones registradas.',
        );
      }
      throw error;
    }

    // Limpieza best-effort del storage: si falla, la mesa ya se borró de
    // todas formas, así que no lo tratamos como un error para el usuario.
    await this.supabaseService.client.storage
      .from(BUCKET)
      .remove([`${id}.jpg`, `qr-${id}.png`])
      .catch((err) => console.error('No se pudo limpiar el storage de la mesa:', err));
  }

  private async webPathABlob(webPath: string): Promise<Blob> {
    const respuesta = await fetch(webPath);
    return respuesta.blob();
  }

  private async subirImagen(nombreArchivo: string, blob: Blob): Promise<string> {
    const { error } = await this.supabaseService.client.storage
      .from(BUCKET)
      .upload(nombreArchivo, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data } = this.supabaseService.client.storage
      .from(BUCKET)
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }

  private async generarYSubirQr(mesaId: string): Promise<string> {
    const dataUrl = await QRCode.toDataURL(mesaId, {
      width: 512,
      margin: 2,
    });
    const blob = await (await fetch(dataUrl)).blob();
    return this.subirImagen(`qr-${mesaId}.png`, blob);
  }
}
