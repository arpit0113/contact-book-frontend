import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Contact, ContactType } from '../../models/contact';
import { Email, Phone } from '../../models/phone-email';
import { AuthService } from '../../services/auth.service';
import { ContactService } from '../../services/contact.service';
import { apiError } from '../../utils/api-error';
import { contactsToCsv, downloadCsv } from '../../utils/contact-csv';
import { fakeAsync } from '@angular/core/testing';
import { Inject } from '@angular/core';


@Component({
  selector: 'app-contacts-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contacts-list.component.html',
  styleUrl: './contacts-list.component.scss',
})
export class ContactsListComponent implements OnInit, OnDestroy {
  contacts = signal<Contact[]>([]);
  loading = signal(true);
  error = signal('');
  exporting = signal(false);

  activeTab: ContactType = 'PERSONAL';
  search = '';
  sort: 'asc' | 'desc' = 'asc';

  private search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private contactService: ContactService, private auth: AuthService) {}

  ngOnInit() {
    this.sub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadContacts());
    this.loadContacts();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onSearchChange(value: string) {
    this.search$.next(value);
  }

  exportPersonal() {
  this.exporting.set(true);
  this.error.set('');
  this.contactService.getAll('PERSONAL', undefined, 'asc').subscribe({
    next: (data) => {
      this.exporting.set(false);
      if (!data.length) {
        this.error.set('You have no personal contacts to export.');
        return;
      }
      const day = new Date().toISOString().slice(0, 10);
      downloadCsv(`personal-contacts-${day}.csv`, contactsToCsv(data));
    },
    error: (err) => {
      this.error.set(apiError(err, 'Failed to export contacts'));
      this.exporting.set(false);
    },
  });
}

  switchTab(tab: ContactType) {
    this.activeTab = tab;
    this.loadContacts();
  }

  loadContacts() {
    this.loading.set(true);
    this.error.set('');
    this.contactService.getAll(this.activeTab, this.search, this.sort).subscribe({
      next: (data) => {
        this.contacts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'Cannot load contacts'));
        this.loading.set(false);
      },
    });
  }

  get isPersonalUser() {
    return this.auth.hasAnyRole(['USER']);
  }
  primaryPhone(contact: Contact): Phone | null {
    return contact.phones.find((p) => p.primary) ?? contact.phones[0] ?? null;
  }

  primaryEmail(contact: Contact): Email | null {
    return contact.emails.find((e) => e.primary) ?? contact.emails[0] ?? null;
  }

  extraCount(contact: Contact): number {
    return Math.max(0, contact.phones.length - 1) + Math.max(0, contact.emails.length - 1);
  }

  canDelete(contact: Contact): boolean {
    return contact.type === 'PERSONAL' || this.auth.canEditCommonDirectly();
  }

  delete(event: Event, contact: Contact) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete "${contact.name}"?`)) return;
    this.contactService.deleteContact(contact.id).subscribe({
      next: () => this.contacts.set(this.contacts().filter((c) => c.id !== contact.id)),
      error: (err) => this.error.set(apiError(err, 'Failed to delete')),
    });
  }
}
