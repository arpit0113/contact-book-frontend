import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { OrgRole, PermissionInfo } from '../../models/organization';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { apiError 
} from '../../utils/api-error';

interface RoleForm {
  id: number | null;
  name: string;
  systemRole: boolean;
  selected: Set<string>;
}


@Component({
  selector: 'app-roles',
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  private roleService = inject(RoleService);
  private auth = inject(AuthService);


  roles = signal<OrgRole[]>([]);
  permissions = signal<PermissionInfo[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  editing: RoleForm | null = null;


  ngOnInit() { this.load(); }


  load() {
    this.loading.set(true);
    forkJoin({ roles: this.roleService.list(), permissions: this.roleService.permissions() }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles.set(roles);
        this.permissions.set(permissions);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'Failed to load roles'));
        this.loading.set(false);
      },
    });
  }


  describe(code: string): string {
    return this.permissions().find((p) => p.code === code)?.description ?? code;
  }


  newRole() {
    this.error.set('');
    this.editing = { id: null, name: '', systemRole: false, selected: new Set() };
  }


  edit(r: OrgRole) {
    this.error.set('');
    this.editing = { id: r.id, name: r.name, systemRole: r.systemRole, selected: new Set(r.permissions) };
  }


  cancel() { this.editing = null; }


  isChecked(code: string): boolean { return !!this.editing?.selected.has(code); }


  toggle(code: string) {
    if (!this.editing) return;
    if (this.editing.selected.has(code)) this.editing.selected.delete(code);
    else this.editing.selected.add(code);
  }


  save() {
    if (!this.editing) return;
    const name = this.editing.name.trim();
    if (!name) {
      this.error.set('Give the role a name.');
      return;
    }
    const body = { name, permissions: [...this.editing.selected] };
    const call = this.editing.id == null
      ? this.roleService.create(body)
      : this.roleService.update(this.editing.id, body);


    this.saving.set(true);
    this.error.set('');
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing = null;
        this.load();
        this.auth.loadProfile().subscribe({ error: () => {} });   // refresh my own sidebar
      },
      error: (err) => {
        this.error.set(apiError(err, 'Could not save the role'));
        this.saving.set(false);
      },
    });
  }


  remove(r: OrgRole) {
    if (!window.confirm(`Delete the role "${r.name}"?`)) return;
    this.error.set('');
    this.roleService.remove(r.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(apiError(err, 'Could not delete the role')),
    });
  }
}