import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  async tomarFoto() {
    const resultado = await Camera.takePhoto({
      quality: 90
    });

    return resultado;
  }
}