import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user';
import { Expression } from '@angular/compiler';


export function homeFor(role: Role | null): string {
  return role === 'SUPER_ADMIN' ? '/super-admin/organization-requests' : '/contacts';
}


export function roleGuard(allowedRoles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const decide = (role: Role | null) =>
      role && allowedRoles.includes(role) ? true : router.createUrlTree([homeFor(role)]);

    const cached = auth.getRole();
    if (cached) return decide(cached);

    return auth.loadProfile().pipe(
      map((user) => decide(user.role)),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  };
}

export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  const cached = auth.getRole();
  if (cached) return router.createUrlTree([homeFor(cached)]);

  return auth.loadProfile().pipe(
    map((user) => router.createUrlTree([homeFor(user.role)])),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

function check(allow : (auth: AuthService) => boolean) : CanActivateFn{
  return () => {
    const auth = inject (AuthService);
    const router = inject(Router);
    const decide = () => (allow(auth) ? true : router.createUrlTree([homeFor(auth.getRole())]));
    if(auth.getRole() && auth.hasCachedPermissions()){
      return decide();
    }
     return auth.loadProfile().pipe(
      map(() => decide()),
      catchError(() => of(router.createUrlTree(['/login'])))
     );
  };
}

export const contactGuard = check((a) => a.canUseContacts());
export const myRequestsGuard = check((a) => a.needsApproval());
export const permissionGuard = (permission : string) => check((a) => a.hasPermission(permission));
