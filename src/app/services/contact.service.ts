import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Contact,ContactPage, ContactType } from '../models/contact';
import { ContactChangeRequest, ContactRequestDTO, ContactWriteResultDTO } from '../models/contact-request-dto';
import { CryptoService } from './crypto.service';

const API_URL = `${environment.API}/api/contacts`;
// backend: @RequestMapping("/api/contact-requests")
const REQUESTS_URL = `${environment.API}/api/contact-requests`;

export interface BulkImportRowError { row: number; message: string; }
export interface BulkImportResult {
  totalRows: number;
  created: number;
  pendingApproval: number;
  skipped: number;
  errors: BulkImportRowError[];
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private http: HttpClient, private cryptoservice: CryptoService) {}

  getAll(type?: ContactType, search?: string, sort: 'asc' | 'desc' = 'asc'): Observable<Contact[]> {
    let params = new HttpParams().set('sort', `name,${sort}`);
    if (type) params = params.set('type', type);
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<Contact[]>(API_URL, { params });
  }

  getPage(type: ContactType | undefined, search: string, sort: 'asc' | 'desc' = 'asc' , page:number, size = 20): Observable<ContactPage> {
    let params = new HttpParams()
    .set('sort', `name,${sort}`)
    .set('page', page)
    .set('size', size);
    if (type) params = params.set('type', type);
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<ContactPage>(`${API_URL}/paged`, { params });
  }

  getById(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${API_URL}/${id}`);
  }

  addContact(dto: ContactRequestDTO): Observable<ContactWriteResultDTO> {
    return this.http.post<ContactWriteResultDTO>(API_URL, dto);
  }

  updateContact(id: number, dto: ContactRequestDTO): Observable<ContactWriteResultDTO> {
    return this.http.put<ContactWriteResultDTO>(`${API_URL}/${id}`, dto);
  }

  deleteContact(id: number): Observable<void> {
    return this.http.delete<void>(`${API_URL}/${id}`);
  }

  importCsv(file: File): Observable<BulkImportResult> {
    return from(this.cryptoservice.encryptFileForUpload(file)).pipe(
      switchMap((payload) => this.http.post<BulkImportResult>(`${API_URL}/import-encrypted`, payload))
    );
  }


  getPendingRequests(): Observable<ContactChangeRequest[]> {
    return this.http.get<ContactChangeRequest[]>(`${REQUESTS_URL}/pending`);
  }

  getMyRequests(): Observable<ContactChangeRequest[]> {
    return this.http.get<ContactChangeRequest[]>(`${REQUESTS_URL}/mine`);
  }

  approveRequest(id: number): Observable<Contact> {
    return this.http.post<Contact>(`${REQUESTS_URL}/${id}/approve`, {});
  }

  rejectRequest(id: number, note?: string): Observable<void> {
    return this.http.post<void>(`${REQUESTS_URL}/${id}/reject`, note ? { note } : {});
  }

  cancelRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${REQUESTS_URL}/${id}`);
  }
}
