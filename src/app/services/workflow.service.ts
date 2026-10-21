import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApprovalPolicy, PolicyAction, PolicyRequest, Workflow, WorkflowRequest } from '../models/workflow';


const URL = `${environment.API}/api/workflows`;


@Injectable({ providedIn: 'root' })
export class WorkflowService {
  constructor(private http: HttpClient) {}


  list(): Observable<Workflow[]> { return this.http.get<Workflow[]>(URL); }
  create(body: WorkflowRequest): Observable<Workflow> { return this.http.post<Workflow>(URL, body); }
  update(id: number, body: WorkflowRequest): Observable<Workflow> { return this.http.put<Workflow>(`${URL}/${id}`, body); }
  remove(id: number): Observable<void> { return this.http.delete<void>(`${URL}/${id}`); }


  policies(): Observable<ApprovalPolicy[]> { return this.http.get<ApprovalPolicy[]>(`${URL}/policies`); }
  setPolicy(body: PolicyRequest): Observable<ApprovalPolicy> { return this.http.put<ApprovalPolicy>(`${URL}/policies`, body); }
  clearPolicy(actionType: PolicyAction, roleId: number): Observable<void> {
    return this.http.delete<void>(`${URL}/policies`, { params: { actionType, roleId } });
  }
}