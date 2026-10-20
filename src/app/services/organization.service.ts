import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApproveUserRequest, PendingUser } from '../models/organization';
import { OrgRole } from '../models/organization';

const API_URL = `${environment.API}/api/organizations`;

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  constructor(private http: HttpClient) {}

  getRoles(): Observable<OrgRole[]>{
    return this.http.get<OrgRole[]>(`${environment.API}/api/roles`);
  }

  getPendingUsers(): Observable<PendingUser[]> {
    return this.http.get<PendingUser[]>(`${API_URL}/pending-users`);
  }

  approveUser(userId: number, dto: ApproveUserRequest): Observable<void> {
    return this.http.post<void>(`${API_URL}/pending-users/${userId}/approve`, dto);
  }

  rejectUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/pending-users/${userId}/reject`);
  }
}
