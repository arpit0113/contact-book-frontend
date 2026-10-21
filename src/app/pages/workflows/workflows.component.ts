import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { OrgRole } from '../../models/organization';
import { ApprovalMode, ApprovalPolicy, PolicyAction, Workflow } from '../../models/workflow';
import { AuthService } from '../../services/auth.service';
import { RoleService } from '../../services/role.service';
import { WorkflowService } from '../../services/workflow.service';
import { apiError } from '../../utils/api-error';


interface FlowForm {
  id: number | null;
  name: string;
  mode: ApprovalMode;
  roleIds: (number | null)[];
}


@Component({
  selector: 'app-workflows',
  imports: [CommonModule, FormsModule],
  templateUrl: './workflows.component.html',
})
export class WorkflowsComponent implements OnInit {
  private workflowService = inject(WorkflowService);
  private roleService = inject(RoleService);
  private auth = inject(AuthService);


  workflows = signal<Workflow[]>([]);
  policies = signal<ApprovalPolicy[]>([]);
  roles = signal<OrgRole[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  editing: FlowForm | null = null;


  readonly actions: { value: PolicyAction; label: string }[] = [
    { value: 'CREATE', label: 'Adds a common contact' },
    { value: 'UPDATE', label: 'Edits a common contact' },
  ];


  ngOnInit() { this.load(); }


  load() {
    this.loading.set(true);
    forkJoin({
      workflows: this.workflowService.list(),
      policies: this.workflowService.policies(),
      roles: this.roleService.list(),
    }).subscribe({
      next: ({ workflows, policies, roles }) => {
        this.workflows.set(workflows);
        this.policies.set(policies);
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'Failed to load approval flows'));
        this.loading.set(false);
      },
    });
  }


  /** Roles that are allowed to approve (they hold the review permission). */
  get approverRoles(): OrgRole[] {
    return this.roles().filter((r) => r.permissions.includes('REQUEST_APPROVE'));
  }


  /** Every role except ADMIN, which never needs approval. */
  get requesterRoles(): OrgRole[] {
    return this.roles().filter((r) => r.name !== 'ADMIN');
  }


  summary(w: Workflow): string {
    const names = w.steps.map((s) => s.roleName);
    return w.mode === 'ANY_ONE' ? 'Any one of: ' + names.join(', ') : names.join(' → ');
  }


  // ---------- flow builder ----------


  newFlow() {
    this.error.set('');
    this.editing = { id: null, name: '', mode: 'SEQUENTIAL', roleIds: [null] };
  }


  edit(w: Workflow) {
    this.error.set('');
    this.editing = { id: w.id, name: w.name, mode: w.mode, roleIds: w.steps.map((s) => s.roleId) };
  }


  cancel() { this.editing = null; }


  addStep() { this.editing?.roleIds.push(null); }


  removeStep(i: number) {
    if (this.editing && this.editing.roleIds.length > 1) this.editing.roleIds.splice(i, 1);
  }


  moveStep(i: number, direction: -1 | 1) {
    if (!this.editing) return;
    const ids = this.editing.roleIds;
    const j = i + direction;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }


  save() {
    if (!this.editing) return;
    const name = this.editing.name.trim();
    if (!name) {
      this.error.set('Give the flow a name.');
      return;
    }
    const roleIds = this.editing.roleIds.filter((id): id is number => id != null);
    if (roleIds.length !== this.editing.roleIds.length) {
      this.error.set('Choose a role for every step.');
      return;
    }
    const body = { name, mode: this.editing.mode, roleIds };
    const call: Observable<unknown> = this.editing.id == null
      ? this.workflowService.create(body)
      : this.workflowService.update(this.editing.id, body);


    this.saving.set(true);
    this.error.set('');
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing = null;
        this.load();
      },
      error: (err) => {
        this.error.set(apiError(err, 'Could not save the flow'));
        this.saving.set(false);
      },
    });
  }


  remove(w: Workflow) {
    if (!window.confirm(`Delete the flow "${w.name}"?`)) return;
    this.error.set('');
    this.workflowService.remove(w.id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(apiError(err, 'Could not delete the flow')),
    });
  }


  // ---------- who needs approval ----------


  policyFor(roleId: number, action: PolicyAction): number | null {
    return this.policies().find((p) => p.requesterRoleId === roleId && p.actionType === action)?.workflowId ?? null;
  }


  noneLabel(role: OrgRole): string {
    return role.permissions.includes('CONTACT_COMMON_DIRECT') ? 'No approval (changes directly)' : 'Not allowed';
  }


  onPolicyChange(role: OrgRole, action: PolicyAction, workflowId: number | null) {
    this.error.set('');
    const call: Observable<unknown> = workflowId == null
      ? this.workflowService.clearPolicy(action, role.id)
      : this.workflowService.setPolicy({ actionType: action, requesterRoleId: role.id, workflowId });


    call.subscribe({
      next: () => this.reloadPolicies(),
      error: (err) => {
        this.error.set(apiError(err, 'Could not save this setting'));
        this.reloadPolicies();
      },
    });
  }


  private reloadPolicies() {
    this.workflowService.policies().subscribe({ next: (p) => this.policies.set(p) });
    this.auth.loadProfile().subscribe({ error: () => {} });   // my own "My Requests" link may change
  }
}
