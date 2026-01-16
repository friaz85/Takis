import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { DynamicBackgroundComponent } from './components/dynamic-background.component';
import { ToastComponent } from './components/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, DynamicBackgroundComponent, ToastComponent],
  template: `
    <div class="main-layout">
      <app-dynamic-background></app-dynamic-background>
      <app-toast></app-toast>
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
}
