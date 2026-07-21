import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataRoomService } from '../../core/data-room.service';
import {
  AccessLogEntry,
  DataRoomFile,
  DataRoomVisibility,
  MAX_FILE_BYTES,
  VISIBILITY_OPTIONS,
} from '../../core/models';

/** Founder data room (tasks #12/#13): upload, manage visibility, see who viewed. */
@Component({
  selector: 'app-data-room',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './data-room.component.html',
})
export class DataRoomComponent {
  private readonly dataRoom = inject(DataRoomService);

  readonly visibilityOptions = VISIBILITY_OPTIONS;
  readonly maxBytes = MAX_FILE_BYTES;

  readonly files = signal<DataRoomFile[]>([]);
  readonly log = signal<AccessLogEntry[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  selectedVisibility: DataRoomVisibility = 'PRIVATE';

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.dataRoom.list().subscribe({
      next: (f) => {
        this.files.set(f);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your data room.');
        this.loading.set(false);
      },
    });
    this.dataRoom.accessLog().subscribe({
      next: (l) => this.log.set(l),
      error: () => undefined,
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.error.set(null);
    this.notice.set(null);

    // Check client-side first so an oversized file isn't uploaded just to be
    // rejected; the API enforces the same limit regardless.
    if (file.size > this.maxBytes) {
      this.error.set(
        `"${file.name}" is ${this.mb(file.size)}MB. The limit is ${this.mb(this.maxBytes)}MB per file.`,
      );
      input.value = '';
      return;
    }

    this.uploading.set(true);
    this.dataRoom.upload(file, this.selectedVisibility).subscribe({
      next: () => {
        this.uploading.set(false);
        this.notice.set(`Uploaded ${file.name}.`);
        input.value = '';
        this.refresh();
      },
      error: (err) => {
        this.uploading.set(false);
        input.value = '';
        this.error.set(
          err?.status === 413
            ? `That file is too large. The limit is ${this.mb(this.maxBytes)}MB per file.`
            : (err?.error?.message ?? 'Upload failed. Please try again.'),
        );
      },
    });
  }

  changeVisibility(file: DataRoomFile, event: Event): void {
    const visibility = (event.target as HTMLSelectElement).value as DataRoomVisibility;
    this.error.set(null);
    this.dataRoom.setVisibility(file.id, visibility).subscribe({
      next: (updated) => {
        this.files.set(this.files().map((f) => (f.id === file.id ? { ...f, visibility: updated.visibility } : f)));
        this.notice.set(`${file.fileName} is now ${this.visibilityLabel(updated.visibility)}.`);
      },
      error: () => this.error.set('Could not change visibility.'),
    });
  }

  /** Requests a fresh short-lived signed link, then opens it. */
  view(file: DataRoomFile): void {
    this.error.set(null);
    this.dataRoom.requestAccess(file.id).subscribe({
      next: (link) => {
        window.open(this.dataRoom.absoluteSignedUrl(link.url), '_blank', 'noopener');
        // The view is audited server-side; refresh so the log reflects it.
        setTimeout(() => this.refresh(), 800);
      },
      error: () => this.error.set('You do not have access to that file.'),
    });
  }

  visibilityLabel(v: DataRoomVisibility): string {
    return this.visibilityOptions.find((o) => o.value === v)?.label ?? v;
  }

  mb(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1);
  }

  kb(bytes: number | null): string {
    return bytes === null ? '—' : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
}
