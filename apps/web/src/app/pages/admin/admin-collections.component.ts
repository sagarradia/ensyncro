import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CollectionItem,
  CollectionsService,
  CollectionSpec,
} from '../../core/collections.service';

type FormModel = Record<string, string | number | boolean | null>;

/**
 * One generic editor for every homepage content collection (sample listings,
 * match preview, team, testimonials, blog, achievements). The form is built from
 * the server's collection specs, so all six share this single page — add a
 * collection or a field on the backend and it appears here automatically.
 */
@Component({
  selector: 'app-admin-collections',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-collections.component.html',
  styles: [
    `
      .col-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0 0.25rem; }
      .col-tab {
        padding: 0.45rem 0.85rem; border-radius: 999px; border: 1px solid var(--color-border);
        background: var(--color-card); color: var(--color-text-secondary); font: inherit; cursor: pointer;
      }
      .col-tab.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
      .col-note { margin: 0.25rem 0 1rem; }
      .col-list { list-style: none; margin: 0; padding: 0; }
      .col-row {
        display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        padding: 0.75rem 0; border-bottom: 1px solid var(--color-border);
      }
      .col-row-main { display: flex; align-items: center; gap: 0.85rem; }
      .col-thumb { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
      .col-row-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
      .col-row-actions .btn, .col-form-actions .btn { margin-top: 0; }
      .col-form-actions { display: flex; gap: 0.6rem; margin-top: 1rem; }
      .col-inline { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center; }
      .col-img-preview { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
      .col-img-preview img { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; }
      .req { color: #a3341f; }
      label.inline { display: inline-flex; align-items: center; gap: 0.4rem; }
    `,
  ],
})
export class AdminCollectionsComponent {
  private readonly collections = inject(CollectionsService);

  readonly specs = signal<CollectionSpec[]>([]);
  readonly selectedSlug = signal<string | null>(null);
  readonly items = signal<CollectionItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly saving = signal(false);

  /** Id of the item being edited, or null when the form is for a new entry. */
  readonly editingId = signal<string | null>(null);
  form: FormModel = {};
  imageId: string | null = null;
  imageUrl: string | null = null;

  readonly spec = computed<CollectionSpec | null>(
    () => this.specs().find((s) => s.slug === this.selectedSlug()) ?? null,
  );

  constructor() {
    this.collections.specs().subscribe({
      next: (r) => {
        this.specs.set(r.specs);
        this.loading.set(false);
        if (r.specs.length) this.select(r.specs[0].slug);
      },
      error: () => {
        this.error.set('Could not load collections. You may not have access.');
        this.loading.set(false);
      },
    });
  }

  select(slug: string): void {
    this.selectedSlug.set(slug);
    this.resetForm();
    this.reload();
  }

  private reload(): void {
    const slug = this.selectedSlug();
    if (!slug) return;
    this.collections.list(slug).subscribe({
      next: (r) => this.items.set(r.items),
      error: () => this.error.set('Could not load entries.'),
    });
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.form = { published: true, sortOrder: 0 };
    this.imageId = null;
    this.imageUrl = null;
    this.error.set(null);
  }

  edit(item: CollectionItem): void {
    this.editingId.set(item.id);
    this.form = {
      title: item.title,
      subtitle: item.subtitle,
      body: item.body,
      linkUrl: item.linkUrl,
      sector: item.sector,
      matchPct: item.matchPct,
      date: item.date,
      published: item.published,
      sortOrder: item.sortOrder,
    };
    this.imageId = item.imageId;
    this.imageUrl = this.collections.mediaUrl(item.imageUrl);
    this.notice.set(null);
    this.error.set(null);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  /** Absolute URL for a list thumbnail from an API-relative media path. */
  collectionsMedia(rel: string | null): string | null {
    return this.collections.mediaUrl(rel);
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    this.collections.uploadImage(file).subscribe({
      next: (r) => {
        this.imageId = r.id;
        this.imageUrl = this.collections.mediaUrl(r.url);
        this.uploading.set(false);
      },
      error: (e) => {
        this.uploading.set(false);
        this.error.set(this.messageOf(e, 'Could not upload that image.'));
      },
    });
  }

  clearImage(): void {
    this.imageId = null;
    this.imageUrl = null;
  }

  save(): void {
    const spec = this.spec();
    if (!spec) return;
    const body: Partial<CollectionItem> = {
      published: (this.form['published'] as boolean) ?? true,
      sortOrder: Number(this.form['sortOrder'] ?? 0),
    };
    for (const f of spec.fields) {
      const v = this.form[f.name];
      (body as Record<string, unknown>)[f.name] = v === '' ? null : v;
    }
    if (spec.image) body.imageId = this.imageId;

    if (!body.title || String(body.title).trim() === '') {
      this.error.set('A title is required.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    const id = this.editingId();
    const req = id ? this.collections.update(id, body) : this.collections.create(spec.slug, body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.notice.set(id ? 'Entry updated.' : 'Entry added.');
        this.resetForm();
        this.reload();
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(this.messageOf(e, 'Could not save that entry.'));
      },
    });
  }

  remove(item: CollectionItem): void {
    this.collections.remove(item.id).subscribe({
      next: () => {
        this.notice.set('Entry removed.');
        if (this.editingId() === item.id) this.resetForm();
        this.reload();
      },
      error: () => this.error.set('Could not remove that entry.'),
    });
  }

  private messageOf(e: unknown, fallback: string): string {
    const m = (e as { error?: { message?: string | string[] } })?.error?.message;
    return Array.isArray(m) ? m.join(', ') : (m ?? fallback);
  }
}
