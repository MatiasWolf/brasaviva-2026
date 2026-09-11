import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  async tomarFoto(): Promise<{ webPath?: string }> {

    if (Capacitor.isNativePlatform()) {
      return await Camera.takePhoto({
        quality: 90
      });
    }

    return await this.elegirArchivoWeb();
  }

  private elegirArchivoWeb(): Promise<{ webPath?: string }> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');

      input.onchange = () => {
        const archivo = input.files?.[0];
        resolve({ webPath: archivo ? URL.createObjectURL(archivo) : undefined });
      };

      window.addEventListener('focus', function alCancelar() {
        window.removeEventListener('focus', alCancelar);
        setTimeout(() => {
          if (!input.files?.length) {
            resolve({ webPath: undefined });
          }
        }, 500);
      });

      input.click();
    });
  }
}
