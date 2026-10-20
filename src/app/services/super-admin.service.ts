import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrgCreationRequestSummary } from '../models/auth';

const API_URL = `${environment.API}/api/super-admin/organization-requests`;

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  constructor(private http: HttpClient) {}

  getPending(): Observable<OrgCreationRequestSummary[]> {
    return this.http.get<OrgCreationRequestSummary[]>(API_URL);
  }

  getById(id:number): Observable<OrgCreationRequestSummary>{
    return this.http.get<OrgCreationRequestSummary>(`${API_URL}/${id}`);
  }

  approve(id: number): Observable<void> {
    return this.http.post<void>(`${API_URL}/${id}/approve`, {});
  }


  reject(id: number, reviewNote?: string): Observable<void> {
    return this.http.post<void>(`${API_URL}/${id}/reject`, reviewNote ? { reviewNote } : {});
  }
}
