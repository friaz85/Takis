import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CampaignService } from '../services/campaign.service';
import { ToastService } from '../services/toast.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-code-input',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="code-page">
      <div class="intensity-card">
        <h2 class="title">REGISTRO DE <span class="highlight">CÓDIGOS</span></h2>
        
        <div class="message-container" *ngIf="campaign.isOver()">
          <p class="announcement">
            El registro de códigos ha terminado, te invitamos a canjear todos tus puntos.<br>
            Te esperamos en <a href="https://www.golacticosbarcel.com" target="_blank" style="color: white; text-decoration: underline;">www.golacticosbarcel.com</a>
          </p>
        </div>

        <div class="input-section" *ngIf="!campaign.isOver()">
          <div class="input-wrapper">
             <input type="text" [(ngModel)]="code" placeholder="ESCRIBE TU CÓDIGO AQUÍ" class="code-input" (keyup.enter)="redeemCode()">
          </div>
          <button (click)="redeemCode()" [disabled]="loading()" class="takis-btn primary">
            {{ loading() ? 'CANJEANDO...' : 'CANJEAR CÓDIGO' }}
          </button>
        </div>

        <a routerLink="/rewards" class="takis-btn secondary" style="margin-top: 1rem;">
          VER RECOMPENSAS
        </a>
      </div>
    </div>
  `,
  styles: [`
    .code-page { min-height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .intensity-card { background: rgba(108, 29, 218, 0.1); backdrop-filter: blur(20px); border: 2px solid #6C1DDA; padding: 4rem; border-radius: 2rem; text-align: center; max-width: 600px; width: 100%; box-shadow: 0 0 30px rgba(108, 29, 218, 0.3); }
    .title { color: white; font-weight: 900; font-size: 2.5rem; margin-bottom: 2.5rem; text-transform: uppercase; }
    .highlight { color: #F2E74B; }
    .message-container { background: rgba(255,255,255,0.05); border: 3px dashed #F2E74B; border-radius: 1rem; padding: 2rem; margin-bottom: 2.5rem; }
    .announcement { color: #F2E74B; font-size: 1.5rem; font-weight: 700; line-height: 1.4; margin: 0; }
    .takis-btn { display: block; width: 100%; padding: 1.2rem; border: none; border-radius: 1rem; font-weight: 900; font-size: 1.2rem; cursor: pointer; transition: 0.3s; text-decoration: none; text-align: center; }
    .primary { background: #F2E74B; color: #1A0B2E; }
    .secondary { background: transparent; border: 2px solid #F2E74B; color: #F2E74B; }
    .takis-btn:hover { transform: scale(1.02); opacity: 0.9; }
    .input-wrapper { margin-bottom: 2rem; }
    .code-input { width: 100%; background: rgba(255,255,255,0.1); border: 2px solid #6C1DDA; padding: 1.2rem; border-radius: 1rem; color: white; font-size: 1.5rem; text-align: center; text-transform: uppercase; font-weight: 900; outline: none; }
    .code-input:focus { border-color: #F2E74B; box-shadow: 0 0 20px rgba(242, 231, 75, 0.3); }
  `]
})
export class CodeInputComponent {
  code = '';
  loading = signal(false);
  public campaign = inject(CampaignService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);

  redeemCode() {
    if (!this.code.trim()) {
      this.toast.show('POR FAVOR INGRESA UN CÓDIGO', 'error');
      return;
    }

    this.loading.set(true);
    const user = JSON.parse(localStorage.getItem('takis_session') || '{}')?.user;

    this.http.post(`${environment.apiUrl}/codes/redeem`, {
      code: this.code.toUpperCase(),
      user_id: user.id || 0
    }).subscribe({
      next: (res: any) => {
        this.toast.show(`¡CÓDIGO ACEPTADO! +${res.points} PUNTOS`, 'success');
        this.code = '';
        this.loading.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        this.toast.show(err.error?.message || 'ERROR AL CANJEAR EL CÓDIGO', 'error');
        this.loading.set(false);
      }
    });
  }
}
