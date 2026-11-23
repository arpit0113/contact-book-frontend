import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  OrgCreationRequest, OrgCreationResponse, OtpVerifyRequest, ResendOtpRequest,
} from '../models/auth';
import { AccountType, Role, User } from '../models/user';
import { KeycloakService } from './keycloak.service';

const ORG_AUTH_URL = `${environment.API}/api/auth/organizations`;
const ME_URL = `${environment.API}/api/users/me`;


const ROLE = 'role';
const PERMISSIONS = 'permissions';
const NEEDS_APPROVAL = 'needsApproval';
const ACCOUNT_TYPE = 'accountType';
const PROFILE_OWNER = 'profileOwner';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private keycloak: KeycloakService) {}


  isLoggedIn(): boolean {
    return this.keycloak.authenticated;
  }

  logout() {
    this.clearCache();
    this.keycloak.logout();
  }


  forceLogout() {
    this.logout();
  }



  loadProfile(): Observable<User> {
    return this.http.get<User>(ME_URL).pipe(tap((user) => this.cacheProfile(user)));
  }

  private cacheProfile(user: User): void {
    localStorage.setItem(PROFILE_OWNER, this.keycloak.subject ?? '');
    if (user.role) localStorage.setItem(ROLE, user.role);
    else localStorage.removeItem(ROLE);
    localStorage.setItem(ACCOUNT_TYPE, user.accountType);
    localStorage.setItem(PERMISSIONS, JSON.stringify(user.permissions ?? []));
    localStorage.setItem(NEEDS_APPROVAL, String(!!user.needsApproval));
  }

  private clearCache(): void {
    [ROLE, PERMISSIONS, NEEDS_APPROVAL, ACCOUNT_TYPE, PROFILE_OWNER].forEach((k) => localStorage.removeItem(k));
  }

  private cacheValid(): boolean {
    const owner = localStorage.getItem(PROFILE_OWNER);
    return !!owner && owner === this.keycloak.subject;
  }

  getRole(): Role | null {
    return this.cacheValid() ? ((localStorage.getItem(ROLE) as Role) ?? null) : null;
  }

  hasCachedPermissions(): boolean {
    return this.cacheValid() && localStorage.getItem(PERMISSIONS) !== null;
  }

  getPermissions(): string[] {
    if (!this.cacheValid()) return [];
    try {
      return JSON.parse(localStorage.getItem(PERMISSIONS) ?? '[]');
    } catch {
      return [];
    }
  }

  hasPermission(p: string): boolean {
    return this.getPermissions().includes(p);
  }

  hasAnyRole(roles: Role[]): boolean {
    const current = this.getRole();
    return current != null && roles.includes(current);
  }

  getAccountType(): AccountType | null {
    return this.cacheValid() ? (localStorage.getItem(ACCOUNT_TYPE) as AccountType | null) : null;
  }

  isPersonalAccount(): boolean {
    return this.getAccountType() === 'PERSONAL';
  }

  isSuperAdmin(): boolean {
    return this.getAccountType() === 'SUPER_ADMIN';
  }

  canUseContacts(): boolean {
    const acType = this.getAccountType();
    return acType != null && acType !== 'SUPER_ADMIN';
  }

  isOrgMember(): boolean {
    return this.getAccountType() === 'ORG_MEMBER';
  }

  canEditCommonDirectly(): boolean {
    return this.hasPermission('CONTACT_COMMON_DIRECT');
  }

  needsApproval(): boolean {
    return this.isOrgMember() && this.cacheValid() && localStorage.getItem(NEEDS_APPROVAL) === 'true';
  }


  requestOrganization(dto: OrgCreationRequest): Observable<OrgCreationResponse> {
    return this.http.post<OrgCreationResponse>(`${ORG_AUTH_URL}/request`, dto);
  }

  verifyOtp(dto: OtpVerifyRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${ORG_AUTH_URL}/verify-otp`, dto);
  }

  resendOtp(dto: ResendOtpRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${ORG_AUTH_URL}/resend-otp`, dto);
  }
}