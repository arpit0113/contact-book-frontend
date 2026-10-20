import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { UserUpdateDTO } from '../models/user-update';

const API_URL = `${environment.API}/api/users`;

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http:HttpClient) { }

  getUser():Observable<User>{
    return this.http.get<User>(`${API_URL}/me`);
  }

  updateUser(dto:UserUpdateDTO): Observable<User>{
    return this.http.put<User>(`${API_URL}/me`, dto);
  }

    deleteUser(): Observable<void>{
    return this.http.delete<void>(`${API_URL}/me`);
  }
}
