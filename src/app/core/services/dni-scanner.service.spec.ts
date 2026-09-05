import { DniScannerService } from './dni-scanner.service';

describe('DniScannerService', () => {
  const service = new DniScannerService();

  it('parsea el texto típico del PDF417 del DNI', () => {
    const texto =
      '00385617597@QUIROGA@JUAN CARLOS@M@27717418@A@06/03/1990@25/06/2018@';

    const datos = service.parsearTextoDni(texto);

    expect(datos).not.toBeNull();
    expect(datos?.apellido).toBe('QUIROGA');
    expect(datos?.nombre).toBe('JUAN CARLOS');
    expect(datos?.dni).toBe('27717418');
    expect(datos?.sexo).toBe('M');
    expect(datos?.fechaNacimiento).toBe('06/03/1990');
    expect(datos?.cuil).toBe('23277174189');
  });

  it('devuelve null si el texto no tiene forma de DNI', () => {
    expect(service.parsearTextoDni('cualquier cosa')).toBeNull();
    expect(service.parsearTextoDni('')).toBeNull();
  });

  it('calcula el mismo CUIL para el mismo DNI y sexo', () => {
    expect(service.calcularCuil('27717418', 'M')).toBe('23277174189');
  });
});
