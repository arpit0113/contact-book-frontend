import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse, LoginRequest, OrgCreationRequest, OrgCreationResponse,
  OtpVerifyRequest, ResendOtpRequest, SignUpRequest, TokenPair,
} from '../models/auth';
import { Role, User } from '../models/user';

const USER_AUTH_URL = `${environment.API}/api/auth/user`;
const ORG_AUTH_URL = `${environment.API}/api/auth/organizations`;
const ME_URL = `${environment.API}/api/users/me`;

const ACCESS_TOKEN = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';
const ROLE = 'role';
const PERMISSIONS ='permissions';
const NEEDS_APPROVAL = 'needsApproval'

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  login(dto: LoginRequest): Observable<User> {
    return this.http.post<TokenPair>(`${USER_AUTH_URL}/login`, dto).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      switchMap(() => this.loadProfile())
    );
  }

 
  signup(dto: SignUpRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${USER_AUTH_URL}/register`, dto).pipe(
      tap((res) => {
        if (res.status === 'ACTIVE' && res.accesstoken && res.refreshToken) {
          this.storeTokens({ accessToken: res.accesstoken, refreshToken: res.refreshToken });
         if(res.user){
          this.cacheProfile(res.user);
         }
        }
      })
    );
  }

  refresh(): Observable<TokenPair> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<TokenPair>(`${USER_AUTH_URL}/refresh`, { refreshToken })
      .pipe(tap((res) => this.storeTokens(res)));
  }

  loadProfile(): Observable<User> {
    return this.http.get<User>(ME_URL).pipe(
      tap((user) => {
        this.cacheProfile(user)
      })
    );
  }

  loginWithGoogle() {
    window.location.href = `${environment.API}/oauth2/authorization/google`;
  }

  
  completeOAuthLogin(accessToken: string, refreshToken: string | null): Observable<User> {
    this.storeTokens({ accessToken, refreshToken: refreshToken ?? '' });
    return this.loadProfile();
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${USER_AUTH_URL}/logout`, { refreshToken }).subscribe({
        next: () => {},
        error: () => {},
      });
    }
    this.clearTokens();
    this.router.navigate(['/login']);
  }

  forceLogout() {
    this.clearTokens();
    this.router.navigate(['/login']);
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


  private storeTokens(tokens: TokenPair): void {
    localStorage.setItem(ACCESS_TOKEN, tokens.accessToken);
    if (tokens.refreshToken) localStorage.setItem(REFRESH_TOKEN, tokens.refreshToken);
  }

  private cacheProfile(user: User): void {
  if (user.role) this.setRole(user.role);
  this.setPermission(user.permissions ?? []);
  localStorage.setItem(NEEDS_APPROVAL, String(!!user.needsApproval));
}

  private clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(ROLE);
    localStorage.removeItem(PERMISSIONS);
    localStorage.removeItem(NEEDS_APPROVAL);
  }

  getAccessToken(): string | null { 
    return localStorage.getItem(ACCESS_TOKEN); 
  }

  getRefreshToken(): string | null { 
    return localStorage.getItem(REFRESH_TOKEN);
   }

  isLoggedIn(): boolean { 
    return !!this.getAccessToken(); 
  }

  setRole(role: Role): void { 
    localStorage.setItem(ROLE, role); 
  }

  getRole(): Role | null { 
    return (localStorage.getItem(ROLE) as Role) ?? null;
   }

  setPermission(p : string[]): void {
  localStorage.setItem(PERMISSIONS, JSON.stringify(p));
  }
  hasCachedPermissions(): boolean{
    return localStorage.getItem(PERMISSIONS) !== null;
  }
  getPermissions(): string[]{
    try{
      return JSON.parse(localStorage.getItem(PERMISSIONS) ?? '[]');

    }catch{
      return [];
    }
  }
  hasPermission(p:string) : boolean{
    return this.getPermissions().includes(p);
  }
  hasAnyRole(roles: Role[]): boolean {
    const current = this.getRole();
    return current != null && roles.includes(current);
  }

  isSuperAdmin(): boolean { 
    return this.getRole() === 'SUPER_ADMIN';
  }

  canUseContacts(): boolean {
    const r =  this.getRole();
    return r != null && r !== 'SUPER_ADMIN';
  }

  isOrgMember(): boolean{
        const r =  this.getRole();
    return r != null && r !== 'SUPER_ADMIN' && r !== 'USER';
  }

  canEditCommonDirectly() : boolean{
    return this.hasPermission('CONTACT_COMMON_DIRECT');
  }

  needsApproval(): boolean{
    return this.isOrgMember() && localStorage.getItem(NEEDS_APPROVAL) === 'true';
  }
}
