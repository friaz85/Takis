import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-help-chat',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="help-bubble" (click)="toggle()">
        <span>?</span>
    </div>
    
    <div class="chat-window" *ngIf="isOpen()">
        <div class="chat-header">
            <h3>SOPORTE TAKIS</h3>
            <button (click)="toggle()">X</button>
        </div>
        <div class="chat-body">
            <div class="faq">
                <p><strong>FAQs:</strong></p>
                <button (click)="msg='¿Cómo canjeo mi premio?'">¿Cómo canjeo?</button>
                <button (click)="msg='Mi código no funciona'">Código no funciona</button>
            </div>
            <textarea [(ngModel)]="msg" placeholder="Escribe tu duda intensa..."></textarea>
            <button (click)="send()" class="send-btn">ENVIAR TICKET</button>
        </div>
    </div>
  `,
    styles: [`
    .help-bubble { position: fixed; bottom: 30px; left: 30px; background: #6C1DDA; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 1.5rem; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.3); z-index: 1001; }
    .chat-window { position: fixed; bottom: 100px; left: 30px; width: 300px; background: #2D1B4E; border: 2px solid #6C1DDA; border-radius: 1.5rem; overflow: hidden; z-index: 1001; box-shadow: 0 15px 40px rgba(0,0,0,0.5); }
    .chat-header { background: #6C1DDA; padding: 1rem; display: flex; justify-content: space-between; align-items: center; color: white; }
    .chat-body { padding: 1.5rem; }
    .faq button { background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid #444; padding: 0.5rem; border-radius: 0.5rem; font-size: 0.7rem; margin-right: 0.5rem; margin-bottom: 0.5rem; cursor: pointer; }
    textarea { width: 100%; height: 100px; background: #1A0B2E; border: 1px solid #6C1DDA; color: white; border-radius: 0.5rem; padding: 0.5rem; margin-top: 1rem; outline: none; }
    .send-btn { width: 100%; margin-top: 1rem; padding: 0.75rem; background: #F2E74B; color: #1A0B2E; border: none; border-radius: 0.5rem; font-weight: 900; cursor: pointer; }
  `]
})
export class HelpChatComponent {
    isOpen = signal(false);
    msg = '';
    private http = inject(HttpClient);

    toggle() { this.isOpen.set(!this.isOpen()); }

    send() {
        if (!this.msg) return;
        this.http.post('https://takis.qrewards.com.mx/api/index.php/support/ticket', { message: this.msg }).subscribe({
            next: () => {
                alert('¡Ticket enviado! Te contactaremos pronto.');
                this.msg = '';
                this.toggle();
            }
        });
    }
}
