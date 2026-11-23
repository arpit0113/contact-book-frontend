import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { KeycloakService } from '../services/keycloak.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const keycloak = inject(KeycloakService);
  if (keycloak.authenticated) return true;

  keycloak.login(`${window.location.origin}${state.url}`);
  return false;
};