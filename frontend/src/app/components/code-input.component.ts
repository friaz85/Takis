import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-code-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="code-page">
      <div class="intensity-card">
        <h2 class="title">REGISTRA TU <span class="highlight">CÓDIGO</span></h2>
        <div class="input-wrapper">
          <input type="text" [(ngModel)]="code" placeholder="TKS-000000" maxlength="10">
        </div>
        <button (click)="redeem()" class="takis-btn" [disabled]="loading() || !code">
          {{ loading() ? 'PROCESANDO...' : 'ACTIVAR PUNTOS' }}
        </button>
        
        @if (message()) {
          <div class="response animate__animated animate__fadeInUp">
            {{ message() }}
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .code-page { min-height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .intensity-card { background: rgba(108, 29, 218, 0.1); backdrop-filter: blur(20px); border: 2px solid #6C1DDA; padding: 4rem; border-radius: 2rem; text-align: center; max-width: 500px; width: 100%; box-shadow: 0 0 30px rgba(108, 29, 218, 0.3); }
    .title { color: white; font-weight: 900; font-size: 2rem; margin-bottom: 2rem; }
    .highlight { color: #F2E74B; }
    .input-wrapper input { width: 100%; padding: 1.5rem; background: rgba(255,255,255,0.05); border: 3px dashed #F2E74B; border-radius: 1rem; color: #F2E74B; font-size: 1.8rem; font-weight: 900; text-align: center; outline: none; margin-bottom: 2rem; }
    .takis-btn { width: 100%; padding: 1.2rem; background: #F2E74B; color: #1A0B2E; border: none; border-radius: 1rem; font-weight: 900; font-size: 1.2rem; cursor: pointer; transition: 0.3s; }
    .takis-btn:hover:not(:disabled) { background: white; transform: scale(1.02); }
    .response { margin-top: 2rem; color: #00ffaa; font-weight: bold; }
  `]
})
export class CodeInputComponent {
    code = '';
    loading = signal(false);
    message = signal('');
    private http = inject(HttpClient);

    redeem() {
        this.loading.set(true);
        this.http.post('https://takis.qrewards.com.mx/api/index.php/redeem', { code: this.code }).subscribe({
            next: (res: any) => {
                this.loading.set(false);
                this.message.set(res.message);
                this.code = '';
            },
            error: (err) => {
                this.loading.set(false);
                this.message.set('Error: ' + (err.error?.message || 'Código inválido.'));
            }
        });
    }
}
