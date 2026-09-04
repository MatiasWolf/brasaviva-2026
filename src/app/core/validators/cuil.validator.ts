import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function cuilCoherenteConDni(
  dniKey = 'dni',
  cuilKey = 'cuil',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dni = String(group.get(dniKey)?.value ?? '').trim();
    const cuil = String(group.get(cuilKey)?.value ?? '').trim();

    if (!/^\d{7,8}$/.test(dni) || !/^\d{11}$/.test(cuil)) {
      return null;
    }

    return cuil.slice(2, 10) === dni.padStart(8, '0')
      ? null
      : { cuilNoCoincideDni: true };
  };
}
