import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrgRole, PendingUser } from '../../models/organization';
import { OrganizationService } from '../../services/organization.service';
import { apiError } from '../../utils/api-error';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pending-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './pending-users.component.html',
  styleUrl: './pending-users.component.scss',
})
export class PendingUsersComponent {
  users = signal<PendingUser[]>([]);
  loading = signal(true);
  error = signal('');
  approvingId = signal<number | null>(null);
  rejectingId = signal<number | null>(null);
  roles = signal<OrgRole[]>([]);
  // tracks the selected role per user id, so each row's dropdown is independent
  selectedRole: Record<number, number> = {};

  constructor(private organizationService: OrganizationService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    forkJoin({
      users : this.organizationService.getPendingUsers(),
      roles : this.organizationService.getRoles(),
    }).subscribe({
        next: ({users, roles}) =>{
        const assignable = roles.filter((r) => r.name !== 'ADMIN');
        const fallback = assignable.find((r) => r.name === 'EMPLOYEE') ?? assignable[0];
        this.roles.set(assignable);
        this.users.set(users);
        if(fallback) users.forEach((u) => (this.selectedRole[u.userId] = fallback.id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to load pending users'));
        this.loading.set(false);
      },
    });
  }

  approve(id: number) {
    const roleId = this.selectedRole[id];
    if(!roleId){
      this.error.set('select a role first');
      return;
    }
    this.approvingId.set(id);
    this.organizationService.approveUser(id, { roleId }).subscribe({
      next: () => {
        this.users.set(this.users().filter((u) => u.userId !== id));
        this.approvingId.set(null);
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to approve user'));
        this.approvingId.set(null);
      },
    });
  }

  reject(id: number) {
    this.rejectingId.set(id);
    this.organizationService.rejectUser(id).subscribe({
      next : () => {
        this.users.set(this.users().filter((u) => u.userId !== id));
        this.rejectingId.set(null);
      },
      error: (err) =>{
        this.error.set(apiError(err, 'failed to reject user'));
        this.rejectingId.set(null);
      }
    });
  }
}
