import { Contact } from '../models/contact';

const HEADER = ['name', 'phones', 'emails', 'notes', 'type'];

function safe(text: string): string {
  return /^[=+\-@\t\(\r\)]/.test(text) ? `'${text}` : text;
}

function cell(text: string): string {
  return `"${text.replace(/"/g, '""')}"`;
}
function joinEntries(items: { value: string; lable: string; primary: boolean }[]): string {
  return items.map((i) => `${i.primary ? '*' : ''}${i.lable.toLowerCase()}:${i.value}`).join(';');
}

export function contactsToCsv(contacts: Contact[]): string {
  const rows = contacts.map((c) => [
    safe(c.name ?? ''),
    joinEntries(c.phones.map((p) => ({ value: p.phone, lable: p.lable, primary: p.primary }))),
    joinEntries(c.emails.map((e) => ({ value: e.email, lable: e.lable, primary: e.primary }))),
    safe(c.notes ?? ''),
    c.type,
  ]);
  return [HEADER, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}