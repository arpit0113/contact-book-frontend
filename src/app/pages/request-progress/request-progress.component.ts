import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ContactChangeRequest } from '../../models/contact-request-dto';


@Component({
  selector: 'app-request-progress',
  imports: [CommonModule],
  template: `
    @if (request.steps && request.steps.length) {
    <div class="small mt-2">
      <div class="text-muted mb-1">
        {{ request.workflowName }}
        @if (request.status === 'PENDING' && request.waitingFor) {
          · waiting for {{ request.waitingFor }}
          @if (request.mode === 'SEQUENTIAL') { (step {{ request.currentStep }} of {{ request.totalSteps }}) }
        }
      </div>
      <div class="d-flex flex-wrap align-items-center gap-1">
        @for (s of request.steps; track s.order; let last = $last) {
          <span class="badge fw-normal" [ngClass]="badgeClass(s.state)">{{ symbol(s.state) }} {{ s.roleName }}</span>
          @if (!last) { <span class="text-muted">{{ request.mode === 'ANY_ONE' ? '/' : '→' }}</span> }
        }
      </div>
    </div>
    }
  `,
})
export class RequestProgressComponent {
  @Input({ required: true }) request!: ContactChangeRequest;


  badgeClass(state: string): string {
    switch (state) {
      case 'DONE': return 'text-bg-success';
      case 'CURRENT': return 'text-bg-warning';
      case 'REJECTED': return 'text-bg-danger';
      default: return 'text-bg-light border';
    }
  }


  symbol(state: string): string {
    return state === 'DONE' ? '✓' : state === 'REJECTED' ? '✕' : '';
  }
}