import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function rolGuard(rolesPermitidos: string[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const usuario = auth.usuarioActual ?? (await auth.cargarUsuarioActual());
    const rol = usuario?.roles?.nombre ?? '';

    return rolesPermitidos.includes(rol) ? true : router.createUrlTree(['/home']);
  };
}
