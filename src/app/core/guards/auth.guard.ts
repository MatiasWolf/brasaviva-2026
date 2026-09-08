import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AnonymousSessionService } from '../services/anonymous-session.service';

export const authGuard: CanActivateFn = async () => {

  const auth = inject(AuthService);
  const anonymousSession = inject(AnonymousSessionService);
  const router = inject(Router);

  const haySesion = await auth.getSesionActiva();

  if (haySesion) {
    return true;
  }

  const sesionAnonima = await anonymousSession.obtenerSesion();

  if (sesionAnonima) {
    return true;
  }

  return router.createUrlTree(['/login']);
};