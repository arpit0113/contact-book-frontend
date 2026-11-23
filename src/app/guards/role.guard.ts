import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { KeycloakService } from '../services/keycloak.service';
import { accessReason } from '../utils/access-error';


export function homeFor(accountType: string | null): string {
  return accountType === 'SUPER_ADMIN' ? '/super-admin/organization-requests' : '/contacts';
}

function accessPage(router: Router, err: any) {
  return router.createUrlTree(['/access'], { queryParams: { reason: accessReason(err) ?? 'error' } });
}

export const homeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const keycloak = inject(KeycloakService);
  if (!auth.isLoggedIn()) {
    keycloak.login();
    return false;
  }


  const cached = auth.getAccountType();
  if (cached) return router.createUrlTree([homeFor(cached)]);


  return auth.loadProfile().pipe(
    map((user) => router.createUrlTree([homeFor(user.accountType)])),
    catchError((err) => of(accessPage(router, err)))
  );
};


function check(allow: (auth: AuthService) => boolean): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const decide = () => (allow(auth) ? true : router.createUrlTree([homeFor(auth.getAccountType())]));


    if (auth.getAccountType() && auth.hasCachedPermissions()) return decide();


    return auth.loadProfile().pipe(
      map(() => decide()),
      catchError((err) => of(accessPage(router, err)))
    );
  };
}


export const superAdminGuard = check((a) => a.isSuperAdmin());
export const contactGuard = check((a) => a.canUseContacts());
export const myRequestsGuard = check((a) => a.needsApproval());
export const permissionGuard = (permission: string) => check((a) => a.hasPermission(permission));