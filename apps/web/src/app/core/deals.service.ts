import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DealDetail, DealStage, DealSummary } from './models';

/** Deal Management (PRD v2 §5). */
@Injectable({ providedIn: 'root' })
export class DealsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(): Observable<DealSummary[]> {
    return this.http.get<DealSummary[]>(`${this.base}/deals`);
  }

  get(id: string): Observable<DealDetail> {
    return this.http.get<DealDetail>(`${this.base}/deals/${id}`);
  }

  changeStage(id: string, stage: DealStage): Observable<DealDetail> {
    return this.http.patch<DealDetail>(`${this.base}/deals/${id}/stage`, { stage });
  }

  addComment(id: string, body: string): Observable<DealDetail> {
    return this.http.post<DealDetail>(`${this.base}/deals/${id}/comments`, { body });
  }

  addTask(id: string, title: string): Observable<DealDetail> {
    return this.http.post<DealDetail>(`${this.base}/deals/${id}/tasks`, { title });
  }

  toggleTask(id: string, taskId: string, done: boolean): Observable<DealDetail> {
    return this.http.patch<DealDetail>(`${this.base}/deals/${id}/tasks/${taskId}`, { done });
  }
}
