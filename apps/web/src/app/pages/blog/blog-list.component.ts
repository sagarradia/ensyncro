import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogTeaser, CollectionsService } from '../../core/collections.service';

/** Public blog index — lists published posts. */
@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <section class="discover">
      <h1>Blog</h1>
      <p class="muted">Ideas on fundraising, from the Ensyncro team.</p>

      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (posts().length) {
        <div class="blog-grid" data-testid="blog-list">
          @for (post of posts(); track post.id) {
            <a class="blog-card" [routerLink]="['/blog', post.id]">
              @if (media(post.imageUrl); as img) { <img class="blog-cover" [src]="img" [alt]="post.title" /> }
              @if (post.date) { <span class="blog-date">{{ post.date | date: 'mediumDate' }}</span> }
              <strong class="blog-title">{{ post.title }}</strong>
              <p class="muted">{{ post.excerpt }}</p>
            </a>
          }
        </div>
      } @else {
        <p class="muted" data-testid="blog-empty">No posts yet — check back soon.</p>
      }
    </section>
  `,
  styles: [
    `
      .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 1.5rem; }
      .blog-card { display: block; background: var(--color-card); border: 1px solid var(--color-border); border-radius: 14px; padding: 1.25rem; text-decoration: none; }
      .blog-card:hover { border-color: var(--color-accent); }
      .blog-cover { width: 100%; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 0.75rem; }
      .blog-date { font-size: 0.8rem; color: var(--color-text-secondary); }
      .blog-title { display: block; margin: 0.25rem 0 0.5rem; font-size: 1.1rem; color: var(--color-text-primary); }
    `,
  ],
})
export class BlogListComponent {
  private readonly collections = inject(CollectionsService);
  readonly posts = signal<BlogTeaser[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.collections.blogList().subscribe({
      next: (r) => { this.posts.set(r.posts); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  media(rel: string | null): string | null {
    return this.collections.mediaUrl(rel);
  }
}
