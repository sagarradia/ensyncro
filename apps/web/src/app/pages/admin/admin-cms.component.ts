import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminCmsContent, CmsService } from '../../core/cms.service';

/**
 * Admin CMS editor (PRD §6). Marketing copy, pricing tiers and the
 * admin-configurable success fee, plus Excel bulk upload. The field list is
 * driven entirely by the server's registry — this page renders whatever groups
 * and fields the API returns, so adding a field needs no change here.
 */
@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-cms.component.html',
})
export class AdminCmsComponent {
  private readonly cms = inject(CmsService);

  readonly content = signal<AdminCmsContent | null>(null);
  /** Editable values keyed by field key. */
  readonly values = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  file: File | null = null;

  readonly groupTitles: Record<string, string> = {
    homepage: 'Homepage copy',
    pricing: 'Pricing tiers',
    settings: 'Settings',
  };

  readonly hasContent = computed(() => (this.content()?.groups.length ?? 0) > 0);

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.cms.adminContent().subscribe({
      next: (c) => {
        this.content.set(c);
        const v: Record<string, string> = {};
        for (const g of c.groups) for (const f of g.fields) v[f.key] = f.value;
        this.values.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load site content. You may not have access.');
        this.loading.set(false);
      },
    });
  }

  setValue(key: string, value: string): void {
    this.values.update((v) => ({ ...v, [key]: value }));
  }

  save(): void {
    const c = this.content();
    if (!c) return;
    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);
    const vals = this.values();
    const updates = c.groups.flatMap((g) => g.fields).map((f) => ({ key: f.key, value: vals[f.key] ?? '' }));
    this.cms.save(updates).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.notice.set(`Saved ${r.updated} field${r.updated === 1 ? '' : 's'}. Live on the homepage now.`);
        this.reload();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(this.messageOf(e, 'Could not save changes.'));
      },
    });
  }

  onFileSelected(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  upload(): void {
    if (!this.file) {
      this.error.set('Choose an .xlsx file first.');
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.cms.bulkUpload(this.file).subscribe({
      next: (r) => {
        this.uploading.set(false);
        const skipped = r.skippedKeys.length ? ` Ignored ${r.skippedKeys.length} unknown key(s).` : '';
        this.notice.set(`Bulk update applied ${r.updated} field${r.updated === 1 ? '' : 's'}.${skipped}`);
        this.file = null;
        this.reload();
      },
      error: (e) => {
        this.uploading.set(false);
        this.error.set(this.messageOf(e, 'Could not process that file.'));
      },
    });
  }

  downloadTemplate(): void {
    this.cms.template().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ensyncro-cms-template.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
      },
      error: () => this.error.set('Could not download the template.'),
    });
  }

  private messageOf(e: unknown, fallback: string): string {
    const m = (e as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(m) ? m.join(', ') : (m ?? fallback);
  }
}
