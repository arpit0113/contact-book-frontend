import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrgCreationRequestSummary } from '../../models/auth';
import { SuperAdminService } from '../../services/super-admin.service';
import { apiError } from '../../utils/api-error';

@Component({
  selector: 'app-org-request-details',
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './org-request-details.component.html',
  styleUrl: './org-request-details.component.scss',
})
export class OrgRequestDetailsComponent implements OnInit {
  request = signal<OrgCreationRequestSummary | null>(null);
  loading = signal(true);
  acting = signal(false);
  error = signal('');

  constructor(private superAdmin: SuperAdminService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.superAdmin.getById(id).subscribe({
      next: (r) => { this.request.set(r); this.loading.set(false); },
      error: (err) => { this.error.set(apiError(err, 'Failed to load the request')); this.loading.set(false); },
    });
  }

  get canReview(): boolean {
    return this.request()?.status === 'PENDING_APPROVAL';
  }

  approve() {
    const r = this.request();
    if (!r || !window.confirm(`Create "${r.orgName}" and make ${r.adminName} its admin?`)) return;
    this.acting.set(true);
    this.superAdmin.approve(r.id).subscribe({
      next: () => this.router.navigate(['/super-admin/organization-requests']),
      error: (err) => this.fail(err, 'Failed to approve'),
    });
  }

  reject() {
    const r = this.request();
    if (!r) return;
    const note = window.prompt('Reason for rejecting (optional):');
    if (note === null) return;
    this.acting.set(true);
    this.superAdmin.reject(r.id, note.trim() || undefined).subscribe({
      next: () => this.router.navigate(['/super-admin/organization-requests']),
      error: (err) => this.fail(err, 'Failed to reject'),
    });
  }

  private fail(err: unknown, fallback: string) {
    this.error.set(apiError(err, fallback));
    this.acting.set(false);
  }
}