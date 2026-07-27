import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogPost, CollectionsService } from '../../core/collections.service';

/** A single public blog post. */
@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <section class="discover">
      <p><a routerLink="/blog" class="muted">← All posts</a></p>

      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (post(); as p) {
        <article class="post">
          @if (media(p.imageUrl); as img) { <img class="post-cover" [src]="img" [alt]="p.title" /> }
          <h1 data-testid="post-title">{{ p.title }}</h1>
          @if (p.date) { <p class="muted">{{ p.date | date: 'longDate' }}</p> }
          <div class="post-body" data-testid="post-body">{{ p.body }}</div>
        </article>
      } @else {
        <p class="alert" role="alert">That post is not available.</p>
      }
    </section>
  `,
  styles: [
    `
      .post { max-width: 720px; }
      .post-cover { width: 100%; max-height: 340px; object-fit: cover; border-radius: 14px; margin-bottom: 1.5rem; }
      .post-body { margin-top: 1.25rem; white-space: pre-wrap; line-height: 1.7; color: var(--color-text-primary); }
    `,
  ],
})
export class BlogPostComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly collections = inject(CollectionsService);
  readonly post = signal<BlogPost | null>(null);
  readonly loading = signal(true);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.collections.blogPost(id).subscribe({
      next: (p) => { this.post.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  media(rel: string | null): string | null {
    return this.collections.mediaUrl(rel);
  }
}
