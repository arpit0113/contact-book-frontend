import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function addAuthHeader(req: HttpRequest<unknown>, token: string | null) {
  if (!token) return req;
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/auth/');
}


let refreshInFlight$: Observable<string> | null = null;

function refreshOnce(auth: AuthService): Observable<string> {
  if (!refreshInFlight$) {
    refreshInFlight$ = auth.refresh().pipe(
      map((tokens) => tokens.accessToken),
      finalize(() => (refreshInFlight$ = null)),
      shareReplay(1)
    );
  }
  return refreshInFlight$;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authReq = isAuthEndpoint(req.url) ? req : addAuthHeader(req, authService.getAccessToken());

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthEndpoint(req.url)) {
        return throwError(() => err);
      }
      if (!authService.getRefreshToken()) {
        authService.forceLogout();
        return throwError(() => err);
      }

      return refreshOnce(authService).pipe(
        catchError((refreshError: HttpErrorResponse) => {
          const serverDown = refreshError.status === 0 || refreshError.status >= 500;
          if (!serverDown) authService.forceLogout();
          return throwError(() => refreshError);
        }),
        switchMap((newToken) => next(addAuthHeader(req, newToken)))
      );
    })
  );
};