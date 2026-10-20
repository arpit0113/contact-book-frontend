import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrgRole, PermissionInfo, RoleRequest } from '../models/organization';

const URL = `${environment.API}/api/roles`;


@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private http: HttpClient) {}

  list(): Observable<OrgRole[]> { 
    return this.http.get<OrgRole[]>(URL); 
  } 

  permissions(): Observable<PermissionInfo[]>
   { 
    return this.http.get<PermissionInfo[]>(`${URL}/permissions`); 
  }
  create(body: RoleRequest): Observable<OrgRole> { 
    return this.http.post<OrgRole>(URL, body);
   }
  update(id: number, body: RoleRequest): Observable<OrgRole> { 
    return this.http.put<OrgRole>(`${URL}/${id}`, body);
   }
  remove(id: number): Observable<void> { 
    return this.http.delete<void>(`${URL}/${id}`);
   }
}
