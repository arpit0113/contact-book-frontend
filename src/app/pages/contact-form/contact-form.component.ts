import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactRequestDTO } from '../../models/contact-request-dto';
import { ContactType } from '../../models/contact';
import { Phone, PhoneLable, Email, EmailLable } from '../../models/phone-email';
import { ContactService } from '../../services/contact.service';
import { AuthService } from '../../services/auth.service';
import { apiError } from '../../utils/api-error';
import { CountryCode } from 'libphonenumber-js';
import { COUNTRY_OPTIONS, DEFAULT_COUNTRY , countryName, digitsOnly,
  exampleNumber, isValidNational, splitE164, toE164,
 } from '../../utils/phone';

interface PhoneRow{
  country : CountryCode;
  national : string;
  lable : PhoneLable;
  primary : boolean;
}


@Component({
  selector: 'app-contact-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.scss',
})
export class ContactFormComponent implements OnInit {
  editId: number | null = null;
  loading = false;
  error = '';
  infoMessage = ''; 

  countryOptions = COUNTRY_OPTIONS;
  phoneRows: PhoneRow[] = [];
  phoneErrors : string[] = [];
  phoneLabels: PhoneLable[] = ['MOBILE', 'WORK', 'HOME', 'OTHER'];
  emailLabels: EmailLable[] = ['WORK', 'HOME', 'OTHER'];

  model: ContactRequestDTO = {
    name: '',
    phones: [],
    emails: [],
    notes: '',
    type: 'PERSONAL',
  };

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const typeParam = this.route.snapshot.queryParamMap.get('type') as ContactType | null;
    if (typeParam) this.model.type = typeParam;
    if(this.isPersonalUser) this.model.type = 'PERSONAL'; 

    if (idParam) {
      this.editId = +idParam;
      this.contactService.getById(this.editId).subscribe({
        next: (contact) => {
          this.model = {
            name: contact.name,
            phones: [],
            emails: contact.emails.map((e) => ({ ...e })),
            notes: contact.notes,
            type: contact.type,
          };
          this.phoneRows = contact.phones.map((p) => ({
            ...splitE164(p.phone),
            lable : p.lable,
            primary : p.primary,
          }))
        },
        error: (err) => (this.error = apiError(err, 'Failed to load contact')),
      });
    } else {
    
      this.addPhone();
      this.addEmail();
    }
  }


  addPhone() {
    const country = this.phoneRows.at(-1)?.country ?? DEFAULT_COUNTRY;
    this.phoneRows.push({ country, national: '', lable: 'MOBILE', primary: this.phoneRows.length === 0 });
  }

  removePhone(index: number) {
    const wasPrimary = this.model.phones[index]?.primary;
    this.phoneRows.splice(index, 1);
    this.phoneErrors.splice(index ,1 );
    if (wasPrimary && this.phoneRows.length > 0) {
      this.phoneRows[0].primary = true;
    }
  }

  setPrimaryPhone(index: number) {
    this.phoneRows.forEach((p, i) => (p.primary = i === index));
  }

  onPhoneInput(row: PhoneRow , index: number, value: string){
    row.national = digitsOnly(value);
    this.phoneErrors[index] = '';
  }

  placeholderFor(row: PhoneRow): string{
    return exampleNumber(row.country);
  }


  addEmail() {
    this.model.emails.push({ email: '', lable: 'OTHER', primary: this.model.emails.length === 0 });
  }

  removeEmail(index: number) {
    const wasPrimary = this.model.emails[index]?.primary;
    this.model.emails.splice(index, 1);
    if (wasPrimary && this.model.emails.length > 0) {
      this.model.emails[0].primary = true;
    }
  }

  setPrimaryEmail(index: number) {
    this.model.emails.forEach((e, i) => (e.primary = i === index));
  }



  save(form: NgForm) {

    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    if(!this.validatePhones()) return;
    const phones : Phone[] = [];
    for(const r of this.phoneRows){
      if( !r.national?.trim()) continue;
      const e164 = toE164(r.country, r.national);
      if(!e164){
        this.error = 'one of the phone number is not valid';
        return;
      }
      phones.push({
        phone: e164,
        lable: r.lable ?? "MOBILE",
        primary: !!r.primary,
      });
    }
    const emails = this.model.emails
      .filter((e) => e.email?.trim())
      .map((e) => ({
        email: e.email.trim(),
        lable: e.lable ?? "OTHER",
        primary: !!e.primary,
      }));

    if (phones.length === 0 && emails.length === 0) {
      this.error = "Add at least one phone number or one email";
      return;
    }

    if(phones.length && !phones.some((p) => p.primary)) phones[0].primary = true;
    if(emails.length && !emails.some((e) => e.primary)) emails[0].primary = true;
    this.loading = true;
    this.error = '';
    this.infoMessage = '';

    const payload: ContactRequestDTO = { ...this.model, phones, emails, notes: this.model.notes ?? '' };
    const request$ = this.editId
      ? this.contactService.updateContact(this.editId, payload)
      : this.contactService.addContact(payload);

    request$.subscribe({
      next: (result) => {
        if (result.pendingApproval) {
          this.infoMessage = 'Submitted — this change needs manager approval before it takes effect.';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/contacts']), 1500);
        } else {
          this.router.navigate(['/contacts']);
        }
      },
      error: (err) => {
        this.error = apiError(err, 'Unable to save contact');
        this.loading = false;
      },
    });
  }

  get needsApproval(): boolean {
    return this.model.type === 'COMMON' && this.auth.needsApproval();
  }
  get isPersonalUser(){
    return this.auth.hasAnyRole(['USER']);
  }

  cancel() {
    this.router.navigate(['/contacts']);
  }


  trackByPhone(index: number, item: any): number {
  return index;
  }

  trackByEmail(index: number, item: any): number {
  return index;
  }

  private validatePhones() : boolean{
    this.phoneErrors = this.phoneRows.map((r) => {
      if(!r.national.trim()) return '';
      return isValidNational(r.country, r.national)
      ? ''
      : `not a valid ${countryName(r.country)} number (e.g. ${exampleNumber(r.country)})`
    });
    return !this.phoneErrors.some(Boolean);
  }
}