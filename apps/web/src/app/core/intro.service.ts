import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IntroInbox, IntroRequest, IntroStatus } from './models';

/** PRD §10 — "request intro" stands in for messaging in v1. */
@Injectable({ providedIn: 'root' })
export class IntroService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  request(toUserId: string, note?: string): Observable<IntroRequest> {
    return this.http.post<IntroRequest>(`${this.base}/intro-requests`, { toUserId, note });
  }

  inbox(): Observable<IntroInbox> {
    return this.http.get<IntroInbox>(`${this.base}/intro-requests`);
  }

  respond(id: string, status: Exclude<IntroStatus, 'PENDING'>): Observable<IntroRequest> {
    return this.http.patch<IntroRequest>(`${this.base}/intro-requests/${id}`, { status });
  }
}
