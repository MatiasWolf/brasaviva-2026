import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Plato } from '../models/plato.model';

const TABLA = 'productos';
const BUCKET = 'productos-fotos';
const CATEGORIA_PLATO = 1;

@Injectable({
  providedIn: 'root'
})
export class PlatoService {

  constructor(private supabaseService: SupabaseService) {}

  async crearPlato(
    datos: {
      nombre: string;
      descripcion: string;
      tiempo_preparacion: number;
      precio: number;
    },
    fotos: File[]
  ): Promise<Plato> {

    if (fotos.length !== 3) {
      throw new Error('Se requieren exactamente tres fotos del plato.');
    }

    const [foto_url, foto2_url, foto3_url] =
      await Promise.all(fotos.map(foto => this.subirFoto(foto)));

    const { data, error } =
      await this.supabaseService.client
        .from(TABLA)
        .insert({
          ...datos,
          foto_url,
          foto2_url,
          foto3_url,
          disponible: true,
          categoria_id: CATEGORIA_PLATO
        })
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data as Plato;
  }

  async listarPlatos(): Promise<Plato[]> {

    const { data, error } =
      await this.supabaseService.client
        .from(TABLA)
        .select('*')
        .eq('categoria_id', CATEGORIA_PLATO)
        .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as Plato[];
  }

  private async subirFoto(foto: File): Promise<string> {

    const extension = foto.name.split('.').pop() || 'jpg';
    const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

    const { error } =
      await this.supabaseService.client
        .storage
        .from(BUCKET)
        .upload(nombreArchivo, foto);

    if (error) {
      throw error;
    }

    const { data } =
      this.supabaseService.client
        .storage
        .from(BUCKET)
        .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }

}
