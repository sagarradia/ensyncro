import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type CmsFieldType = 'text' | 'textarea' | 'list' | 'number';

export interface CmsField {
  key: string;
  label: string;
  type: CmsFieldType;
  help: string | null;
  value: string;
}
export interface CmsGroup {
  name: 'homepage' | 'pricing' | 'settings';
  fields: CmsField[];
}
export interface AdminCmsContent {
  groups: CmsGroup[];
}

export interface CmsSaveResult {
  updated: number;
  appliedKeys: string[];
  skippedKeys: string[];
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
}
export interface PublicContent {
  homepage: {
    tagline: string;
    headline: string;
    subtext: string;
    cta: { headline: string; subtext: string; button: string };
  };
  pricing: { tiers: PricingTier[]; successFeePct: number };
}

export interface PlatformStats {
  founders: number;
  investors: number;
  deals: number;
  dealsClosed: number;
}

/** Admin CMS + the public content feed the homepage renders (PRD §6). */
@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** World-readable content for the homepage (no auth required). */
  publicContent(): Observable<PublicContent> {
    return this.http.get<PublicContent>(`${this.base}/config/content`);
  }

  /** Live platform counters for the homepage stats row (no auth required). */
  stats(): Observable<PlatformStats> {
    return this.http.get<PlatformStats>(`${this.base}/stats`);
  }

  adminContent(): Observable<AdminCmsContent> {
    return this.http.get<AdminCmsContent>(`${this.base}/admin/cms`);
  }

  save(updates: { key: string; value: string }[]): Observable<CmsSaveResult> {
    return this.http.put<CmsSaveResult>(`${this.base}/admin/cms`, { updates });
  }

  bulkUpload(file: File): Observable<CmsSaveResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<CmsSaveResult>(`${this.base}/admin/cms/bulk`, form);
  }

  /** Downloads the prefilled .xlsx template (blob keeps the JWT on the request). */
  template(): Observable<Blob> {
    return this.http.get(`${this.base}/admin/cms/template`, { responseType: 'blob' });
  }
}
