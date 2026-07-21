import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FounderProfile, InvestorProfile } from './models';

/**
 * Founder / investor profile API. The server derives the owning user from the
 * JWT, so no user id is ever sent from the client.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getFounder(): Observable<FounderProfile | null> {
    return this.http.get<FounderProfile | null>(`${this.base}/founder/profile`);
  }

  saveFounder(dto: Partial<FounderProfile>): Observable<FounderProfile> {
    return this.http.put<FounderProfile>(`${this.base}/founder/profile`, dto);
  }

  getInvestor(): Observable<InvestorProfile | null> {
    return this.http.get<InvestorProfile | null>(`${this.base}/investor/profile`);
  }

  saveInvestor(dto: Partial<InvestorProfile>): Observable<InvestorProfile> {
    return this.http.put<InvestorProfile>(`${this.base}/investor/profile`, dto);
  }
}
