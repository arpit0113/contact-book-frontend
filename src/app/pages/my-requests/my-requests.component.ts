import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ContactChangeRequest } from '../../models/contact-request-dto';
import { ContactService } from '../../services/contact.service';
import { apiError } from '../../utils/api-error';
import { forkJoin } from 'rxjs';
import { RequestProgressComponent } from '../request-progress/request-progress.component';

@Component({
  selector: 'app-my-requests',
  imports: [CommonModule, RequestProgressComponent],
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.scss',
})
export class MyRequestsComponent {
  requests = signal<ContactChangeRequest[]>([]);
  loading = signal(true);
  error = signal('');
  cancellingId = signal<number | null>(null);

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    
    this.loading.set(true);
    this.contactService.getMyRequests().subscribe({
      next: (data) => {
        this.requests.set([...data].sort((a,b) => b.id - a.id));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to load your requests'));
        this.loading.set(false);
      },
    });
  }

  get pendingRequests(){
    return this.requests().filter((r) => r.status === 'PENDING');
  }
   get historyRequests(){
    return this.requests().filter((r) => r.status !== 'PENDING');
  }

  actionLabel(r:ContactChangeRequest):string{
    return r.actionType === 'CREATE' ?'Request to add a contact' : 'Request to edit a contact';
  }
  clearHistory(){
    const done = this.historyRequests;
    if(!done.length) return
    if(!window.confirm(`Remove ${done.length} completed request from history?`)) return;
    this.error.set('');
    forkJoin(done.map((r)=> this.contactService.cancelRequest(r.id))).subscribe({
      next : () => this.requests.set(this.requests().filter((r) => r.status === 'PENDING')),
      error : () =>{
        this.error.set(apiError(this.error, 'failed to clear history'));
        this.load();
      },
    });
  }

  cancel(id: number) {
    const pending = this.requests().find((r) => r.id === id)?.status === 'PENDING';
    const msg = pending ? 'cancel this request? it cannot be undone' : 'remove this request from history?';
    if(!window.confirm(msg)) return;
    this.cancellingId.set(id);
    this.contactService.cancelRequest(id).subscribe({
      next: () => {
        this.requests.set(this.requests().filter((r) => r.id !== id));
        this.cancellingId.set(null);
      },
      error: (err) => {
        this.error.set(apiError(err, 'failed to cancel'));
        this.cancellingId.set(null);
      },
    });
  }
}