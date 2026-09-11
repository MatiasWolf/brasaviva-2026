import { Injectable } from '@angular/core';
import { DatosDni, SexoDni } from '../models/dni.model';

@Injectable({
  providedIn: 'root',
})
export class DniScannerService {
  parsearTextoDni(texto: string): DatosDni | null {
    const tokens = texto
      .split('@')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tokens.length < 3) {
      return null;
    }

    const dniToken = tokens.find((t) => /^\d{7,8}$/.test(t));
    const sexoToken = tokens.find(
      (t) => t === 'M' || t === 'F' || t === 'X',
    ) as SexoDni | undefined;
    const fechaToken = tokens.find((t) => /^\d{2}\/\d{2}\/\d{4}$/.test(t));
    const alfabeticos = tokens.filter(
      (t) => t.length > 1 && /^[A-ZÁÉÍÓÚÑ\s]+$/.test(t),
    );

    if (!dniToken || alfabeticos.length < 2) {
      return null;
    }

    const [apellido, nombre] = alfabeticos;
    const sexo = sexoToken ?? null;

    return {
      apellido,
      nombre,
      dni: dniToken,
      sexo,
      fechaNacimiento: fechaToken ?? null,
      cuil: sexo ? this.calcularCuil(dniToken, sexo) : null,
    };
  }

  calcularCuil(dni: string, sexo: SexoDni): string {
    const dniCompleto = dni.padStart(8, '0');
    const prefijoBase = sexo === 'F' ? '27' : '20';

    let prefijo = prefijoBase;
    let dv = this.digitoVerificador(prefijo, dniCompleto);

    if (dv === null) {
      prefijo = '23';
      dv = this.digitoVerificador(prefijo, dniCompleto) ?? 9;
    }

    return `${prefijo}${dniCompleto}${dv}`;
  }

  private digitoVerificador(prefijo: string, dni: string): number | null {
    const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digitos = `${prefijo}${dni}`.split('').map(Number);

    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += digitos[i] * pesos[i];
    }

    const dv = 11 - (suma % 11);
    if (dv === 11) {
      return 0;
    }
    if (dv === 10) {
      return null;
    }
    return dv;
  }
}
