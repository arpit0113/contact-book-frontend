import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { BulkImportResult, ContactService } from '../../services/contact.service';
import { apiError } from '../../utils/api-error';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-contact-import',
  imports: [CommonModule],
  templateUrl: './contact-import.component.html',
  styleUrl: './contact-import.component.scss',
})
export class ContactImportComponent {
  selectedFile: File | null = null;
  uploading = signal(false);
  error = signal('');
  result = signal<BulkImportResult | null>(null);

  constructor(private contactService: ContactService , private auth : AuthService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.result.set(null);
    this.error.set('');
  }

  upload() {
    if (!this.selectedFile) return;
    this.uploading.set(true);
    this.error.set('');
    this.result.set(null);

    this.contactService.importCsv(this.selectedFile).subscribe({
      next: (res) => {
        this.result.set(res);
        this.uploading.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err, 'Import failed — the file may be too large or malformed.'));
        this.uploading.set(false);
      },
    });
  }
   get isPersonalUser(){
    return this.auth.hasAnyRole(['USER']);
  }
}