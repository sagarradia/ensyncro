import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AccessLogEntry, DataRoomFile, DataRoomVisibility, SignedLink } from './models';

@Injectable({ providedIn: 'root' })
export class DataRoomService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(): Observable<DataRoomFile[]> {
    return this.http.get<DataRoomFile[]>(`${this.base}/data-room/files`);
  }

  upload(file: File, visibility: DataRoomVisibility): Observable<DataRoomFile> {
    const form = new FormData();
    form.append('file', file);
    form.append('visibility', visibility);
    // No Content-Type header — the browser must set the multipart boundary.
    return this.http.post<DataRoomFile>(`${this.base}/data-room/files`, form);
  }

  setVisibility(id: string, visibility: DataRoomVisibility): Observable<DataRoomFile> {
    return this.http.patch<DataRoomFile>(`${this.base}/data-room/files/${id}/visibility`, {
      visibility,
    });
  }

  /** Step 1: authorised request that returns a short-lived signed link. */
  requestAccess(id: string): Observable<SignedLink> {
    return this.http.post<SignedLink>(`${this.base}/data-room/files/${id}/access`, {});
  }

  accessLog(): Observable<AccessLogEntry[]> {
    return this.http.get<AccessLogEntry[]>(`${this.base}/data-room/access-log`);
  }

  /**
   * The API returns a signed path like `/api/data-room/...`. Resolve it against
   * the API origin, since the SPA is served from a different host in production.
   */
  absoluteSignedUrl(url: string): string {
    const origin = this.base.replace(/\/api\/?$/, '');
    return origin + url;
  }
}
