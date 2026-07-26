import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DealsService } from '../../core/deals.service';
import { DealDetail, DealStage, DEAL_STAGES } from '../../core/models';

/** Deal detail — stage control, timeline, comments and a task checklist. */
@Component({
  selector: 'app-deal-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './deal-detail.component.html',
})
export class DealDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly deals = inject(DealsService);

  private readonly id = this.route.snapshot.paramMap.get('id')!;
  readonly deal = signal<DealDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stages = DEAL_STAGES;

  commentText = '';
  taskTitle = '';

  constructor() {
    this.deals.get(this.id).subscribe({
      next: (d) => { this.deal.set(d); this.loading.set(false); },
      error: () => { this.error.set('That deal is not available.'); this.loading.set(false); },
    });
  }

  private apply(d: DealDetail): void {
    this.deal.set(d);
    this.error.set(null);
  }
  private fail(): void {
    this.error.set('Something went wrong. Please try again.');
  }

  setStage(event: Event): void {
    const stage = (event.target as HTMLSelectElement).value as DealStage;
    this.deals.changeStage(this.id, stage).subscribe({ next: (d) => this.apply(d), error: () => this.fail() });
  }

  addComment(): void {
    const body = this.commentText.trim();
    if (!body) return;
    this.deals.addComment(this.id, body).subscribe({
      next: (d) => { this.apply(d); this.commentText = ''; },
      error: () => this.fail(),
    });
  }

  addTask(): void {
    const title = this.taskTitle.trim();
    if (!title) return;
    this.deals.addTask(this.id, title).subscribe({
      next: (d) => { this.apply(d); this.taskTitle = ''; },
      error: () => this.fail(),
    });
  }

  toggleTask(taskId: string, done: boolean): void {
    this.deals.toggleTask(this.id, taskId, done).subscribe({ next: (d) => this.apply(d), error: () => this.fail() });
  }

  kindLabel(kind: string): string {
    switch (kind) {
      case 'CREATED': return 'Created';
      case 'STAGE_CHANGED': return 'Stage';
      case 'COMMENT': return 'Comment';
      case 'TASK_ADDED': return 'Task';
      case 'TASK_COMPLETED': return 'Done';
      default: return kind;
    }
  }
}
