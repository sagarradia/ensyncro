import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, concatMap, map, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DataRoomFile,
  DataRoomVisibility,
  MAX_BYTES_BY_KIND,
  MediaKind,
  UploadTicket,
} from './models';

export interface UploadProgress {
  /** 0-100. Reaches 100 only once the API has confirmed the upload. */
  percent: number;
  done: boolean;
  file: DataRoomFile | null;
}

/**
 * Uploads go straight from the browser to object storage.
 *
 * This is not an optimisation: the API runs as a serverless function, and the
 * platform rejects request bodies over ~4.5MB before they reach it. Anything
 * larger has to bypass the API entirely, so the API's role is limited to
 * authorising the upload and confirming it afterwards.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Client-side guard so an oversized file isn't sent just to be refused. */
  maxBytesFor(kind: MediaKind): number {
    return MAX_BYTES_BY_KIND[kind];
  }

  upload(
    file: File,
    kind: MediaKind = 'DOCUMENT',
    visibility: DataRoomVisibility = 'PRIVATE',
  ): Observable<UploadProgress> {
    const ticket$ = this.http.post<UploadTicket>(`${this.base}/data-room/files/upload-url`, {
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      kind,
      visibility,
    });

    return ticket$.pipe(
      switchMap((ticket) =>
        ticket.mode === 'multipart'
          ? this.multipart(file, kind, visibility)
          : this.direct(file, ticket),
      ),
    );
  }

  /**
   * PUT the bytes to storage, then ask the API to confirm. The Authorization
   * header is deliberately absent from the storage request — the interceptor
   * only attaches it to our own API origin, and sending it to a third party
   * would leak the token.
   */
  private direct(
    file: File,
    ticket: Extract<UploadTicket, { mode: 'presigned-put' }>,
  ): Observable<UploadProgress> {
    return this.http
      .put(ticket.uploadUrl, file, {
        headers: ticket.headers,
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        concatMap((event: HttpEvent<unknown>): Observable<UploadProgress> => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // Held just below 100 until the API confirms — the upload is not
            // finished until the bytes have been verified in storage.
            return of({
              percent: Math.round((event.loaded / event.total) * 99),
              done: false,
              file: null,
            });
          }
          // Storage has the bytes; now have the API verify and record them.
          if (event.type === HttpEventType.Response) return this.complete(ticket.fileId);
          return EMPTY;
        }),
      );
  }

  private complete(fileId: string): Observable<UploadProgress> {
    return this.http
      .post<DataRoomFile>(`${this.base}/data-room/files/${fileId}/complete`, {})
      .pipe(map((f) => ({ percent: 100, done: true, file: f })));
  }

  /** Fallback for storage backends that cannot presign (local development). */
  private multipart(
    file: File,
    kind: MediaKind,
    visibility: DataRoomVisibility,
  ): Observable<UploadProgress> {
    const form = new FormData();
    form.append('file', file);
    form.append('visibility', visibility);
    form.append('kind', kind);
    return this.http
      .post<DataRoomFile>(`${this.base}/data-room/files`, form)
      .pipe(map((f) => ({ percent: 100, done: true, file: f })));
  }
}
