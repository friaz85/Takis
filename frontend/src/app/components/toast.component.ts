import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="remove(toast.id)">
            <div class="icon">
                <span *ngIf="toast.type === 'success'">✅</span>
                <span *ngIf="toast.type === 'error'">❌</span>
                <span *ngIf="toast.type === 'info'">ℹ️</span>
            </div>
            <div class="content">
                <span class="message">{{ toast.message }}</span>
            </div>
            <button class="close">×</button>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none; /* Let clicks pass through gaps */
    }

    .toast {
      pointer-events: auto;
      background: rgba(26, 11, 46, 0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.1);
      border-left: 5px solid;
      padding: 1rem 1.2rem;
      border-radius: 8px;
      color: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      min-width: 320px;
      max-width: 450px;
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
    }
    
    .toast:hover { transform: translateX(-5px); }

    .toast.success { border-left-color: #4eff88; background: linear-gradient(90deg, rgba(78, 255, 136, 0.1) 0%, rgba(26, 11, 46, 0.95) 100%); }
    .toast.error { border-left-color: #ff4444; background: linear-gradient(90deg, rgba(255, 68, 68, 0.1) 0%, rgba(26, 11, 46, 0.95) 100%); }
    .toast.info { border-left-color: #F2E74B; background: linear-gradient(90deg, rgba(242, 231, 75, 0.1) 0%, rgba(26, 11, 46, 0.95) 100%); }

    .icon { font-size: 1.2rem; }
    .content { flex: 1; overflow: hidden; }
    .message { font-size: 0.95rem; font-weight: 500; line-height: 1.4; display: block; }
    
    .close { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 0.5; }
    .close:hover { color: white; }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
    toastService = inject(ToastService);

    remove(id: number) {
        this.toastService.remove(id);
    }
}
