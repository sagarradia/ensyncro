import { Component, inject, input, signal } from '@angular/core';
import { DocumentsService, FounderDocKind } from '../../core/documents.service';

/**
 * The "Download Teaser" / "Generate IM" actions. Reused on the founder's own
 * profile and on a founder's product page (for investors/admins) — the same
 * endpoint backs both, and the server decides per-viewer what the IM contains.
 */
@Component({
  selector: 'app-doc-downloads',
  standalone: true,
  template: `
    <div class="card" data-testid="doc-downloads">
      <h2>Documents</h2>
      <p class="muted">
        Auto-generated from this profile's structured data — always up to date, no
        manual authoring. The memorandum includes only the commercial sections you
        are allowed to see.
      </p>
      <div class="doc-actions">
        <button
          type="button"
          class="btn"
          (click)="download('teaser')"
          [disabled]="busy() !== null"
          data-testid="download-teaser"
        >
          {{ busy() === 'teaser' ? 'Preparing…' : 'Download Teaser' }}
        </button>
        <button
          type="button"
          class="btn secondary"
          (click)="download('im')"
          [disabled]="busy() !== null"
          data-testid="download-im"
        >
          {{ busy() === 'im' ? 'Preparing…' : 'Generate IM' }}
        </button>
      </div>
      @if (error()) {
        <p class="alert" role="alert" data-testid="doc-error">{{ error() }}</p>
      }
    </div>
  `,
  styles: [
    `
      .doc-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .doc-actions .btn {
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class DocDownloadsComponent {
  private readonly docs = inject(DocumentsService);

  /** The founder whose documents these are. */
  readonly userId = input.required<string>();
  /** Used to name the downloaded file; falls back to a generic name. */
  readonly companyName = input<string>('');

  readonly busy = signal<FounderDocKind | null>(null);
  readonly error = signal<string | null>(null);

  download(kind: FounderDocKind): void {
    if (this.busy()) return;
    this.busy.set(kind);
    this.error.set(null);
    this.docs.fetch(this.userId(), kind).subscribe({
      next: (blob) => {
        this.docs.save(blob, this.filename(kind));
        this.busy.set(null);
      },
      error: () => {
        this.error.set('Could not generate that document. Please try again.');
        this.busy.set(null);
      },
    });
  }

  private filename(kind: FounderDocKind): string {
    const slug =
      (this.companyName() || 'company')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'company';
    return `${slug}-${kind === 'teaser' ? 'teaser' : 'information-memorandum'}.pdf`;
  }
}
