import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private readonly kc = new Keycloak({
    url: environment.Keycloak.url,
    realm: environment.Keycloak.realm,
    clientId: environment.Keycloak.clientId,
  });


  async init(): Promise<void> {
    try {
      await this.kc.init({
        onLoad: 'check-sso', 
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });
    } catch (e) {
      console.error('Keycloak init failed', e);
    }
  }

  get authenticated(): boolean {
    return this.kc.authenticated === true;
  }

  
  get subject(): string | null {
    return this.kc.subject ?? null;
  }

  login(redirectUri?: string): Promise<void> {
    return this.kc.login({ redirectUri: redirectUri ?? window.location.href });
  }


  logout(): Promise<void> {
    return this.kc.logout({ redirectUri: `${window.location.origin}/` });
  }

  
  async getValidToken(): Promise<string | null> {
    if (!this.authenticated) return null;
    try {
      await this.kc.updateToken(30);
    } catch {
      return null; 
    }
    return this.kc.token ?? null;
  }

  async forceRefresh(): Promise<string | null> {
    if (!this.authenticated) return null;
    try {
      await this.kc.updateToken(-1);
    } catch {
      return null;
    }
    return this.kc.token ?? null;
  }
}