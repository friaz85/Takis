import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-admin-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="admin-login-container">
      <div class="login-card">
        <div class="logo-section">
          <img src="assets/takis-logo.png" alt="Takis" class="logo animate-pulse">
          <h1>Admin Control</h1>
        </div>
        
        <form (submit)="onSubmit($event)">
          <div class="form-group">
            <label>Username</label>
            <input type="text" [(ngModel)]="username" name="username" required placeholder="User">
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••">
          </div>
          
          <div class="error-msg" *ngIf="error()">{{error()}}</div>
          
          <button type="submit" [disabled]="loading()" class="login-btn">
            <span *ngIf="!loading()">Acceder</span>
            <span *ngIf="loading()" class="spinner"></span>
          </button>
        </form>
      </div>
      
      <!-- Animated Background elements -->
      <div class="takis-floater one"></div>
      <div class="takis-floater two"></div>
      <div class="takis-floater three"></div>
    </div>
  `,
    styles: [`
    .admin-login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2d004d 0%, #1a0033 100%);
      position: relative;
      overflow: hidden;
    }

    .login-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 3rem;
      border-radius: 20px;
      width: 100%;
      max-width: 400px;
      z-index: 10;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .logo-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      height: 80px;
      margin-bottom: 1rem;
    }

    h1 {
      color: #ff0000;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 0;
      font-size: 1.5rem;
      text-shadow: 0 0 10px rgba(255,0,0,0.5);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      color: #ccc;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    input {
      width: 100%;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 0.8rem;
      border-radius: 8px;
      color: white;
      transition: all 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #ff0000;
      box-shadow: 0 0 15px rgba(255,0,0,0.2);
    }

    .login-btn {
      width: 100%;
      background: #ff0000;
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      text-transform: uppercase;
    }

    .login-btn:hover {
      background: #cc0000;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(255,0,0,0.3);
    }

    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error-msg {
      color: #ff4d4d;
      font-size: 0.8rem;
      margin-bottom: 1rem;
      text-align: center;
    }

    /* Floaters */
    .takis-floater {
      position: absolute;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%);
      border-radius: 50%;
      filter: blur(40px);
      z-index: 1;
    }

    .one { top: 10%; left: 10%; animation: float 10s infinite alternate; }
    .two { bottom: 10%; right: 10%; animation: float 12s infinite alternate-reverse; }
    .three { top: 40%; right: 20%; animation: float 15s infinite alternate; background: radial-gradient(circle, rgba(147,51,234,0.2) 0%, transparent 70%); }

    @keyframes float {
      from { transform: translate(0,0); }
      to { transform: translate(50px, 50px); }
    }

    @keyframes animate-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .animate-pulse { animation: animate-pulse 2s infinite ease-in-out; }
  `]
})
export class AdminLoginComponent {
    private auth = inject(AuthService);
    private router = inject(Router);

    username = '';
    password = '';
    loading = signal(false);
    error = signal('');

    onSubmit(e: Event) {
        e.preventDefault();
        this.loading.set(true);
        this.error.set('');

        this.auth.adminLogin({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.router.navigate(['/admin/dashboard']);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Error de conexión');
                this.loading.set(false);
            }
        });
    }
}
