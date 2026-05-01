import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { AnalyticsService } from './services/analytics.service';
import { filter } from 'rxjs';
import { DynamicBackgroundComponent } from './components/dynamic-background.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, DynamicBackgroundComponent],
  template: `
    <div class="main-layout">
      <app-dynamic-background></app-dynamic-background>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .main-layout {
      position: relative;
      min-height: 100vh;
      overflow-x: hidden;
      width: 100%;
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.analytics.logVisit(event.urlAfterRedirects);
    });
  }
}
