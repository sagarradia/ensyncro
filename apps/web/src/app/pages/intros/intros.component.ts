import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IntroService } from '../../core/intro.service';
import { IntroInbox } from '../../core/models';

/** Sent and received intro requests (PRD §10). */
@Component({
  selector: 'app-intros',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './intros.component.html',
})
export class IntrosComponent {
  private readonly intros = inject(IntroService);

  readonly inbox = signal<IntroInbox | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.intros.inbox().subscribe({
      next: (i) => { this.inbox.set(i); this.loading.set(false); },
      error: () => { this.error.set('Could not load your intro requests.'); this.loading.set(false); },
    });
  }

  respond(id: string, status: 'ACCEPTED' | 'DECLINED'): void {
    this.intros.respond(id, status).subscribe({
      next: () => this.refresh(),
      error: () => this.error.set('Could not send that response.'),
    });
  }
}
