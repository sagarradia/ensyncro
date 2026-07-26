import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsultantService } from '../../core/consultant.service';
import { ConsultantProfile, CONSULTANT_TYPE_LABELS } from '../../core/models';

/**
 * Consultant landing (MVP scaffold — PRD v2 §4). A placeholder dashboard plus a
 * basic profile editor. Assignment / deliverables / timesheets / billing are
 * the v1.2 Professional Engagement module and are deliberately not here yet.
 */
@Component({
  selector: 'app-consultant-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './consultant-dashboard.component.html',
})
export class ConsultantDashboardComponent {
  private readonly consultant = inject(ConsultantService);

  readonly profile = signal<ConsultantProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly typeLabels = CONSULTANT_TYPE_LABELS;

  form = { name: '', firm: '', registrationNumber: '' };

  constructor() {
    this.consultant.me().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.form = {
          name: p.name ?? '',
          firm: p.firm ?? '',
          registrationNumber: p.registrationNumber ?? '',
        };
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load your consultant profile.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.error.set(null);
    this.consultant.updateProfile({ ...this.form }).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.notice.set('Profile saved.');
      },
      error: () => this.error.set('Could not save your profile.'),
    });
  }
}
