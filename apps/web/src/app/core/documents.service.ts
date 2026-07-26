import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type FounderDocKind = 'teaser' | 'im';

/**
 * Auto-generated founder documents (PRD v2 §3/§7). The PDF is fetched as a blob
 * so the auth interceptor attaches the JWT (a plain <a download> could not send
 * it); the server authorises and audits the same way it does the profile page.
 */
@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  fetch(userId: string, kind: FounderDocKind): Observable<Blob> {
    const file = kind === 'teaser' ? 'teaser.pdf' : 'im.pdf';
    return this.http.get(`${this.base}/founders/${userId}/${file}`, { responseType: 'blob' });
  }

  /** Saves a blob to disk under the given filename via a transient object URL. */
  save(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
