import { FormBuilder } from '@angular/forms';
import { cuilCoherenteConDni } from './cuil.validator';

describe('cuilCoherenteConDni', () => {
  const fb = new FormBuilder();

  const grupo = (dni: string, cuil: string) =>
    fb.group({ dni: [dni], cuil: [cuil] }, { validators: cuilCoherenteConDni() });

  it('acepta un CUIL que contiene el DNI', () => {
    expect(grupo('12345678', '20123456783').errors).toBeNull();
  });

  it('marca cuilNoCoincideDni cuando el DNI del medio no coincide', () => {
    expect(grupo('12345678', '20999999999').errors).toEqual({
      cuilNoCoincideDni: true,
    });
  });

  it('completa el DNI de 7 dígitos a 8 para comparar', () => {
    expect(grupo('1234567', '20012345679').errors).toBeNull();
  });

  it('no valida nada si el formato base todavía no está', () => {
    expect(grupo('123', '20').errors).toBeNull();
  });
});
