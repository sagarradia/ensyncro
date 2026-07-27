import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type CollectionFieldType = 'text' | 'textarea' | 'number' | 'date';

export interface CollectionFieldSpec {
  name: string;
  label: string;
  type: CollectionFieldType;
  required?: boolean;
}
export interface CollectionSpec {
  slug: string;
  kind: string;
  label: string;
  note: string;
  illustrative: boolean;
  image: boolean;
  imageLabel?: string;
  hideWhenEmpty: boolean;
  fields: CollectionFieldSpec[];
}

export interface CollectionItem {
  id: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  linkUrl: string | null;
  sector: string | null;
  matchPct: number | null;
  date: string | null;
  imageId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  published: boolean;
}

export interface HomepageCollections {
  sampleListings: CollectionItem[];
  matchPreview: CollectionItem | null;
  team: CollectionItem[];
  testimonials: CollectionItem[];
  achievements: CollectionItem[];
  blog: BlogTeaser[];
}
export interface BlogTeaser {
  id: string;
  title: string;
  date: string | null;
  imageUrl: string | null;
  excerpt: string;
}
export interface BlogPost {
  id: string;
  title: string;
  date: string | null;
  imageUrl: string | null;
  body: string;
}

/** Homepage repeatable content collections (marketing). */
@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Turns an API-relative media path into an absolute URL. */
  mediaUrl(rel: string | null): string | null {
    return rel ? `${this.base}${rel}` : null;
  }

  // ── Public ───────────────────────────────────────────────────
  homepage(): Observable<HomepageCollections> {
    return this.http.get<HomepageCollections>(`${this.base}/config/collections`);
  }
  blogList(): Observable<{ posts: BlogTeaser[] }> {
    return this.http.get<{ posts: BlogTeaser[] }>(`${this.base}/config/blog`);
  }
  blogPost(id: string): Observable<BlogPost> {
    return this.http.get<BlogPost>(`${this.base}/config/blog/${id}`);
  }

  // ── Admin ────────────────────────────────────────────────────
  specs(): Observable<{ specs: CollectionSpec[] }> {
    return this.http.get<{ specs: CollectionSpec[] }>(`${this.base}/admin/collections/specs`);
  }
  list(slug: string): Observable<{ spec: CollectionSpec; items: CollectionItem[] }> {
    return this.http.get<{ spec: CollectionSpec; items: CollectionItem[] }>(
      `${this.base}/admin/collections/${slug}`,
    );
  }
  create(slug: string, body: Partial<CollectionItem>): Observable<CollectionItem> {
    return this.http.post<CollectionItem>(`${this.base}/admin/collections/${slug}`, body);
  }
  update(id: string, body: Partial<CollectionItem>): Observable<CollectionItem> {
    return this.http.put<CollectionItem>(`${this.base}/admin/collections/item/${id}`, body);
  }
  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/admin/collections/item/${id}`);
  }
  uploadImage(file: File): Observable<{ id: string; url: string }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ id: string; url: string }>(`${this.base}/admin/collections/image`, form);
  }
}
