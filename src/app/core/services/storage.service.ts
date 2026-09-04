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
    id: string,
    webPath: string
  ): Promise<string> {

    const response = await fetch(webPath);
    const blob = await response.blob();

    const nombreArchivo = `${id}.jpg`;

    const { error } = await this.supabaseService.client.storage
      .from(this.bucket)
      .upload(nombreArchivo, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
  
      throw error;
    }

    const { data } = this.supabaseService.client.storage
      .from(this.bucket)
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }

  async eliminarFoto(id: string): Promise<void> {
    const nombreArchivo = `${id}.jpg`;

    const { error } = await this.supabaseService.client.storage
      .from(this.bucket)
      .remove([nombreArchivo]);

    if (error) {
      throw error;
    }
  }
}

