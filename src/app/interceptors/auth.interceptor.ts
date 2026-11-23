import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { KeycloakService } from '../services/keycloak.service';
import { accessReason } from '../utils/access-error';

function withToken(req: HttpRequest<unknown>, token: string | null) {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}


function skipAuth(url: string): boolean {
  return !url.startsWith(environment.API) || url.includes('/api/auth/');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (skipAuth(req.url)) return next(req);

  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const send = (isRetry: boolean): Observable<HttpEvent<unknown>> =>
    from(isRetry ? keycloak.forceRefresh() : keycloak.getValidToken()).pipe(
      switchMap((token) => next(withToken(req, token))),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          if (!keycloak.authenticated) {
            keycloak.login();                      
          } else if (!isRetry) {
            return send(true);                      
          } else {
            
            router.navigate(['/access'], { queryParams: { reason: 'unauthorized' } });
          }
        }
        const reason = accessReason(err);
        if (reason) router.navigate(['/access'], { queryParams: { reason } });
        return throwError(() => err);
      })
    );

  return send(false);
};