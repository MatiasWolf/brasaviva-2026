
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly bucket = 'fotos-perfiles';

  constructor(
    private supabaseService: SupabaseService
  ) {}

  async subirFoto(
    userId: string,
    webPath: string
  ): Promise<string> {

    // Convertir la imagen a Blob
    const response = await fetch(webPath);
    const blob = await response.blob();

    // Nombre único para la foto
    const nombreArchivo = `${userId}.jpg`;

    const { error } = await this.supabaseService.client.storage
      .from(this.bucket)
      .upload(nombreArchivo, blob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      console.error('Error al subir foto:', error);
      throw error;
    }

    // Obtener URL pública
    const { data } = this.supabaseService.client.storage
      .from(this.bucket)
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }
}

