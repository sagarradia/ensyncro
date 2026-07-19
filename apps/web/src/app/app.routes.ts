import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

/**
 * Public marketing, auth, founder, investor, and admin routes
 * (see PRD §5 site map) will be added when feature work begins.
 * For now only the landing page is wired up.
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '**', redirectTo: '' },
];
