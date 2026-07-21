import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DiscoverResult, FounderCard, InvestorCard } from './models';

export interface FounderFilters {
  sector?: string;
  stage?: string;
  fundingMin?: number | null;
  fundingMax?: number | null;
}

export interface InvestorFilters {
  investorType?: string;
  sector?: string;
  ticketMin?: number | null;
  ticketMax?: number | null;
}

@Injectable({ providedIn: 'root' })
export class DiscoverService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Drops empty values so we never send `?sector=` and get a useless filter. */
  private toParams<T extends object>(filters: T): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }

  /** Investors browsing founders. */
  founders(filters: FounderFilters): Observable<DiscoverResult<FounderCard>> {
    return this.http.get<DiscoverResult<FounderCard>>(`${this.base}/founders/discover`, {
      params: this.toParams(filters),
    });
  }

  /** Founders browsing investors. */
  investors(filters: InvestorFilters): Observable<DiscoverResult<InvestorCard>> {
    return this.http.get<DiscoverResult<InvestorCard>>(`${this.base}/investors/discover`, {
      params: this.toParams(filters),
    });
  }
}
