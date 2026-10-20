import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ContactChangeRequest } from '../../models/contact-request-dto';
import { ContactService } from '../../services/contact.service';
import { apiError } from '../../utils/api-error';

@Component({
  selector: 'app-pending-requests',
  imports: [CommonModule],
  templateUrl: './pending-requests.component.html',
  styleUrl: './pending-requests.component.scss',
})
export class PendingRequestsComponent {
  requests = signal<ContactChangeRequest[]>([]);
  loading = signal(true);
  error = signal('');
  actingOnId = signal<number | null>(null);

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.contactService.getPendingRequests().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to load pending requests'));
        this.loading.set(false);
      },
    });
  }

  approve(id: number) {
    this.actingOnId.set(id);
    this.contactService.approveRequest(id).subscribe({
      next: () => {
        this.actingOnId.set(null);
        this.load();
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to approve'));
        this.actingOnId.set(null);
      },
    });
  }

  reject(id: number) {
    const note = window.prompt('Reason for rejecting (optional):');
    if (note === null) return; // user pressed Cancel -> do nothing
    this.actingOnId.set(id);
    this.contactService.rejectRequest(id, note.trim() || undefined).subscribe({
      next: () => {
        this.requests.set(this.requests().filter((r) => r.id !== id));
        this.actingOnId.set(null);
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to reject'));
        this.actingOnId.set(null);
      },
    });
  }
}
