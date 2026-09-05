import { Injectable } from '@angular/core';
import { DatosDni, SexoDni } from '../models/dni.model';

/**
 * Parseo del código PDF417 del DNI argentino (tarjeta, desde ~2012) y cálculo
 * del CUIL a partir del DNI + sexo.
 *
 * El contenido típico es una cadena separada por "@", por ejemplo:
 *   00385617597@QUIROGA@JUAN CARLOS@M@27717418@A@06/03/1990@25/06/2018@
 * (trámite, apellido, nombre, sexo, dni, ejemplar, fecha nacimiento, fecha emisión)
 *
 * El orden exacto puede variar entre versiones de la tarjeta, así que en vez
 * de confiar en la posición de cada campo, se clasifica cada token por su
 * forma (numérico de 7-8 dígitos = DNI, "M"/"F"/"X" = sexo, fecha dd/mm/aaaa,
 * texto en mayúsculas = apellido/nombre). Si no se puede identificar DNI y al
 * menos apellido + nombre, se considera que el código no es un DNI válido.
 */
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

  /**
   * CUIL a partir del DNI y el sexo (dígito verificador módulo 11). Es una
   * estimación: siempre queda en un campo editable para que se pueda corregir.
   */
  calcularCuil(dni: string, sexo: SexoDni): string {
    const dniCompleto = dni.padStart(8, '0');
    const prefijoBase = sexo === 'F' ? '27' : '20';

    let prefijo = prefijoBase;
    let dv = this.digitoVerificador(prefijo, dniCompleto);

    if (dv === null) {
      // Cuando 20/27 no resuelve, la convención habitual usa el prefijo 23.
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
