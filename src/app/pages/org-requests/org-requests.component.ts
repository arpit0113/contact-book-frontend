import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { OrgCreationRequestSummary } from '../../models/auth';
import { SuperAdminService } from '../../services/super-admin.service';
import { apiError } from '../../utils/api-error';
import { Router } from '@angular/router';

@Component({
  selector: 'app-org-requests',
  imports: [CommonModule, DatePipe],
  templateUrl: './org-requests.component.html',
  styleUrl: './org-requests.component.scss',
})
export class OrgRequestsComponent implements OnInit {
  requests = signal<OrgCreationRequestSummary[]>([]);
  loading = signal(true);
  error = signal('');
  actingOnId = signal<number | null>(null);

  constructor(private superAdmin: SuperAdminService , private router : Router) {}

  open(r : OrgCreationRequestSummary){
    this.router.navigate(['/super-admin/organization-requests', r.id]);
  }
  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.superAdmin.getPending().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'Failed to load organization requests'));
        this.loading.set(false);
      },
    });
  }

  approve(event: Event, r: OrgCreationRequestSummary) {
    event.stopPropagation();
    if (!window.confirm(`Create "${r.orgName}" and make ${r.adminName} its admin?`)) return;
    this.actingOnId.set(r.id);
    this.superAdmin.approve(r.id).subscribe({
      next: () => this.removeFromList(r.id),
      error: (err) => this.fail(err, 'Failed to approve'),
    });
  }

  reject(event:Event,r: OrgCreationRequestSummary) {
    event.stopPropagation();
    const note = window.prompt('Reason for rejecting (optional):');
    if (note === null) return; // Cancel -> do nothing
    this.actingOnId.set(r.id);
    this.superAdmin.reject(r.id, note.trim() || undefined).subscribe({
      next: () => this.removeFromList(r.id),
      error: (err) => this.fail(err, 'Failed to reject'),
    });
  }

  private removeFromList(id: number) {
    this.requests.set(this.requests().filter((r) => r.id !== id));
    this.actingOnId.set(null);
  }

  private fail(err: unknown, fallback: string) {
    this.error.set(apiError(err, fallback));
    this.actingOnId.set(null);
  }
}
