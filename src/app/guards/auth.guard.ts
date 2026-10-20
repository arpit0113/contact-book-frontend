import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authservice = inject(AuthService);
  const router = inject(Router);

  return authservice.isLoggedIn() ? true : router.createUrlTree(['/login']);
};
