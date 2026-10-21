import { CommonModule } from '@angular/common';
import { Component,NgZone, ViewChild, OnDestroy, OnInit, signal, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Contact, ContactType } from '../../models/contact';
import { Email, Phone } from '../../models/phone-email';
import { AuthService } from '../../services/auth.service';
import { ContactService } from '../../services/contact.service';
import { apiError } from '../../utils/api-error';
import { contactsToCsv, downloadCsv } from '../../utils/contact-csv';


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
  hasMore = signal(false);
  loadingMore = signal(false);
  showTop = signal(false);


  private scrollEl: Element | null = null;
  private onScroll = (e: Event) => {
  const t = e.target as Node;
  const isDoc = t === document;
  if (!isDoc && !t.contains(this.host.nativeElement)) return;


  this.scrollEl = isDoc ? document.scrollingElement : (t as Element);
  const show = (this.scrollEl?.scrollTop ?? 0) > 400;
  if (show !== this.showTop()) this.zone.run(() => this.showTop.set(show));
};

  private readonly PAGE_SIZE = 20;
  private page = 0;
  private reqSub?: Subscription;
  private observer?: IntersectionObserver;
  private sentinelEl?:HTMLElement;
  
  @ViewChild('sentinel') set sentinel(ref: ElementRef<HTMLElement> | undefined){
    this.observer?.disconnect();
    this.sentinelEl = ref?.nativeElement;
    if(!this.sentinelEl) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if(entries.some((e) => e.isIntersecting)) this.loadMore();
      },
      {rootMargin : '200px'}
    );
    this.observer.observe(this.sentinelEl);
  }


  activeTab: ContactType = 'PERSONAL';
  search = '';
  sort: 'asc' | 'desc' = 'asc';

  private search$ = new Subject<string>();
  private sub?: Subscription;

  constructor(private contactService: ContactService,
               private auth: AuthService,
              private zone: NgZone,
            private host: ElementRef<HTMLElement>
          ) {}

  ngOnInit() {
    this.zone.runOutsideAngular(()=> document.addEventListener('scroll', this.onScroll, true))
    this.sub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.loadContacts());
    this.loadContacts();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.reqSub?.unsubscribe();
    this.observer?.disconnect();
    document.removeEventListener('scroll', this.onScroll, true)
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
    this.reqSub?.unsubscribe();
    this.page = 0;
    this.loading.set(true);
    this.loadingMore.set(false);
    this.hasMore.set(false);
    this.error.set('');
    this.reqSub = this.contactService.getPage(this.activeTab, this.search, this.sort, 0, this.PAGE_SIZE)
    .subscribe({
       next: (data) => {
        this.contacts.set(data.content);
        this.hasMore.set(data.hasMore);
        this.loading.set(false);
        this.recheckSentinel();
      },
      error: (err) => {
        this.error.set(apiError(err, 'Cannot load contacts'));
        this.loading.set(false);
      },
    });
  }

  loadMore() {
  if (this.loading() || this.loadingMore() || !this.hasMore()) return;
  this.loadingMore.set(true);
  const next = this.page + 1;
  this.reqSub = this.contactService
    .getPage(this.activeTab, this.search, this.sort, next, this.PAGE_SIZE)
    .subscribe({
      next: (res) => {
        this.page = next;
        const seen = new Set(this.contacts().map((c) => c.id));
        this.contacts.set([...this.contacts(), ...res.content.filter((c) => !seen.has(c.id))]);
        this.hasMore.set(res.hasMore);
        this.loadingMore.set(false);
        this.recheckSentinel();
      },
      error: (err) => {
        this.error.set(apiError(err, 'Cannot load more contacts'));
        this.loadingMore.set(false);
      },
    });
}


private recheckSentinel() {
  setTimeout(() => {
    if (this.observer && this.sentinelEl) {
      this.observer.unobserve(this.sentinelEl);
      this.observer.observe(this.sentinelEl);
    }
  });
}

scrollToTop(){
  this.scrollEl?.scrollTo({
    top:0,
    behavior: 'smooth'
  })
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
