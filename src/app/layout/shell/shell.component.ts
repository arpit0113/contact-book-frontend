import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  username = '';
  email = '';
  role = '';
  organizationName = '';
  showdropdown = false;
  userservice = inject(UserService);
  authservice = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    this.authservice.loadProfile().subscribe({
      next: (data) => {
        this.username = data.name;
        this.email = data.email;
        this.organizationName = data.organizationName ?? '';
        this.role = data.role ?? '';
      },
      error: () => (this.username = 'account'),
    });
  }

  get isSuperAdmin() { return this.authservice.isSuperAdmin(); }
  get canUseContacts() {return this.authservice.canUseContacts(); }
  get canReview() { return this.authservice.hasPermission('REQUEST_APPROVE'); }
  get needsApproval() {return this.authservice.needsApproval();}
  get canApproveUsers(){return this.authservice.hasPermission('USER_APPROVE');}
  get canManageRoles(){return this.authservice.hasPermission('ROLE_MANAGE');}
  get canManageWorkflows(){return this.authservice.hasPermission('WORKFLOW_MANAGE');}
  
  logout() {
    this.authservice.logout();
  }
}
