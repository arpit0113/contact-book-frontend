import { Component } from '@angular/core';
import { User } from '../../models/user';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { apiError } from '../../utils/api-error';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  model= {
    name : '',
    email : ''
  }
  private originalEmail = '';
  loading = true;
  saving = false;
  error = '';
  success = '';

  constructor(private authservice:AuthService ,private userservice: UserService 
    , private router:Router){}

 ngOnInit(){
  this.userservice.getUser().subscribe({
    next : (data) => {
      this.model.name = data.name;
      this.model.email= data.email;
      this.originalEmail = data.email;
      this.loading = false;
    },
    error : (err) => {
      this.error = apiError(err, 'Cannot load profile');
      this.loading = false;
    }
  });
 }

 save(form:NgForm){
  if(form.invalid){
    form.form.markAllAsTouched();
    return;
  }
  this.saving = true;
  this.error = '';
  this.success='';

  this.userservice.updateUser(this.model).subscribe({
    next : () => {
      this.saving = false;
      if (this.model.email !== this.originalEmail) {
        // access tokens are issued for the old email address, so sign in again
        alert('Email changed. Please sign in again with your new email.');
        this.authservice.forceLogout();
        return;
      }
      this.success = 'Profile updated';
    },
    error : (err) => {
         this.error = apiError(err, 'Failed to update profile');
         this.saving = false;
    },
  });
 }

 deleteUser(){
  if(!(confirm('Do you really want to delete account ??'))){
    return;
  }
  this.userservice.deleteUser().subscribe({
    next: () => {
      this.authservice.forceLogout();
    },
    error: (err) =>{
        this.error = apiError(err, 'Failed to delete account');
    }
  })
 }
}
