import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DataRoomVisibility,
  Financials,
  FounderMedia,
  FundingHistory,
  FundingRound,
  Milestone,
  ProductPage,
  ProfileSection,
  SectionAccessLogEntry,
  StorageUsage,
} from './models';

/** Founder media, product page, and the gated commercial sections. */
@Injectable({ providedIn: 'root' })
export class FounderContentService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Own content ──────────────────────────────────────────────
  media(): Observable<FounderMedia> {
    return this.http.get<FounderMedia>(`${this.base}/founder/profile/media`);
  }

  saveMedia(body: {
    pitchVideoUrl?: string | null;
    pitchVideoFileId?: string | null;
    website?: string | null;
  }): Observable<FounderMedia> {
    return this.http.put<FounderMedia>(`${this.base}/founder/profile/media`, body);
  }

  saveProduct(body: {
    productName?: string | null;
    tagline?: string | null;
    productDescription?: string | null;
    categories?: string[];
    logoFileId?: string | null;
  }): Observable<ProductPage> {
    return this.http.put<ProductPage>(`${this.base}/founder/profile/product`, body);
  }

  financials(): Observable<Financials> {
    return this.http.get<Financials>(`${this.base}/founder/profile/financials`);
  }

  saveFinancials(body: Partial<Financials>): Observable<Financials> {
    return this.http.put<Financials>(`${this.base}/founder/profile/financials`, body);
  }

  setSectionVisibility(
    section: ProfileSection,
    visibility: DataRoomVisibility,
  ): Observable<{ section: ProfileSection; visibility: DataRoomVisibility }> {
    return this.http.put<{ section: ProfileSection; visibility: DataRoomVisibility }>(
      `${this.base}/founder/profile/section-visibility`,
      { section, visibility },
    );
  }

  addMilestone(body: {
    title: string;
    description?: string;
    occurredOn: string;
    achieved?: boolean;
  }): Observable<Milestone> {
    return this.http.post<Milestone>(`${this.base}/founder/profile/milestones`, body);
  }

  removeMilestone(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/founder/profile/milestones/${id}`);
  }

  fundingRounds(): Observable<FundingHistory> {
    return this.http.get<FundingHistory>(`${this.base}/founder/profile/funding-rounds`);
  }

  addFundingRound(body: {
    stage: string;
    amountRaised: number;
    preMoney?: number;
    postMoney?: number;
    closedOn: string;
    leadInvestor?: string;
  }): Observable<FundingRound> {
    return this.http.post<FundingRound>(`${this.base}/founder/profile/funding-rounds`, body);
  }

  removeFundingRound(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/founder/profile/funding-rounds/${id}`);
  }

  sectionAccessLog(): Observable<SectionAccessLogEntry[]> {
    return this.http.get<SectionAccessLogEntry[]>(
      `${this.base}/founder/profile/section-access-log`,
    );
  }

  usage(): Observable<StorageUsage> {
    return this.http.get<StorageUsage>(`${this.base}/data-room/usage`);
  }

  deleteFile(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/data-room/files/${id}`);
  }

  // ── Viewing someone else's ───────────────────────────────────
  product(userId: string): Observable<ProductPage> {
    return this.http.get<ProductPage>(`${this.base}/founders/${userId}/product`);
  }

  theirFinancials(userId: string): Observable<Financials> {
    return this.http.get<Financials>(`${this.base}/founders/${userId}/financials`);
  }

  theirFundingHistory(userId: string): Observable<FundingHistory> {
    return this.http.get<FundingHistory>(`${this.base}/founders/${userId}/funding-history`);
  }
}
