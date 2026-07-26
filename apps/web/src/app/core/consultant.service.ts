import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConsultantProfile } from './models';

/** Consultant profile (MVP scaffold — PRD v2 §4). */
@Injectable({ providedIn: 'root' })
export class ConsultantService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  me(): Observable<ConsultantProfile> {
    return this.http.get<ConsultantProfile>(`${this.base}/consultant/me`);
  }

  updateProfile(body: {
    name?: string;
    firm?: string;
    registrationNumber?: string;
  }): Observable<ConsultantProfile> {
    return this.http.put<ConsultantProfile>(`${this.base}/consultant/profile`, body);
  }
}
