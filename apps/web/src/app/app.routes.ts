import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { FounderOnboardingComponent } from './pages/founder-onboarding/founder-onboarding.component';
import { InvestorOnboardingComponent } from './pages/investor-onboarding/investor-onboarding.component';
import { DiscoverFoundersComponent } from './pages/discover-founders/discover-founders.component';
import { DiscoverInvestorsComponent } from './pages/discover-investors/discover-investors.component';
import { DataRoomComponent } from './pages/data-room/data-room.component';
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
  {
    path: 'investor/onboarding',
    component: InvestorOnboardingComponent,
    canActivate: [roleGuard('INVESTOR')],
  },
  // Cross-side discovery: investors browse founders, founders browse investors.
  {
    path: 'discover/founders',
    component: DiscoverFoundersComponent,
    canActivate: [roleGuard('INVESTOR', 'ADMIN')],
  },
  {
    path: 'discover/investors',
    component: DiscoverInvestorsComponent,
    canActivate: [roleGuard('FOUNDER', 'ADMIN')],
  },
  { path: 'data-room', component: DataRoomComponent, canActivate: [roleGuard('FOUNDER')] },
  { path: '**', redirectTo: '' },
];
