import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Contact } from '../../models/contact';
import { AuthService } from '../../services/auth.service';
import { ContactService } from '../../services/contact.service';
import { apiError } from '../../utils/api-error';

@Component({
  selector: 'app-contact-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './contact-details.component.html',
  styleUrl: './contact-details.component.scss',
})
export class ContactDetailsComponent implements OnInit {
  contact: Contact | null = null;
  loading = true;
  error = '';

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.contactService.getById(id).subscribe({
      next: (data) => {
        this.contact = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = apiError(err, 'Failed to load contact');
        this.loading = false;
      },
    });
  }

  get canDelete(): boolean {
    return !!this.contact && (this.contact.type === 'PERSONAL' || this.auth.canEditCommonDirectly());
  }

  get editNeedsApproval(): boolean {
    return this.contact?.type === 'COMMON' && this.auth.needsApproval();
  }

  delete() {
    if (!this.contact) return;
    if (!window.confirm(`Delete "${this.contact.name}"?`)) return;
    this.contactService.deleteContact(this.contact.id).subscribe({
      next: () => this.router.navigate(['/contacts']),
      error: (err) => (this.error = apiError(err, 'Failed to delete')),
    });
  }

  back() {
    this.router.navigate(['/contacts']);
  }
}
