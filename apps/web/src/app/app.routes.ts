import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { FounderOnboardingComponent } from './pages/founder-onboarding/founder-onboarding.component';
import { roleGuard } from './core/auth.guard';

/**
 * Route table. Guards here are UX only — the API enforces the same rules
 * server-side on every request (PRD §4).
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'founder/onboarding',
    component: FounderOnboardingComponent,
    canActivate: [roleGuard('FOUNDER')],
  },
  { path: '**', redirectTo: '' },
];
