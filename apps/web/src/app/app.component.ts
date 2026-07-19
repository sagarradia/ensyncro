import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly env = environment.appEnv;
  readonly year = new Date().getFullYear();
}
