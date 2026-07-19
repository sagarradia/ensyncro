import { Component } from '@angular/core';

interface RoleCard {
  title: string;
  blurb: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly roles: RoleCard[] = [
    { title: 'Founders', blurb: 'Create a discoverable pitch, share a private data room, and reach the right investors.' },
    { title: 'Investors', blurb: 'Discover founders by sector, stage, and ticket size — angel through institutional.' },
    { title: 'Admins', blurb: 'Operate the platform and its content behind role-based access.' },
  ];
}
