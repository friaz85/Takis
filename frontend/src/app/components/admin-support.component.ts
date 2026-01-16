import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';

@Component({
    selector: 'app-admin-support',
    standalone: true,
    imports: [CommonModule, FormsModule, AdminNavbarComponent],
    template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="support-page">
        <h2 class="title">TICKETS DE <span class="highlight">SOPORTE</span></h2>
        
        <div class="tickets-grid">
            @for (ticket of tickets(); track ticket.id) {
                <div class="ticket-card" [class.open]="ticket.status === 'open'">
                    <div class="header">
                        <span>Ticket #{{ ticket.id }} - {{ ticket.user_name }}</span>
                        <span class="status-badge">{{ ticket.status }}</span>
                    </div>
                    <p class="message">{{ ticket.message }}</p>
                    <div class="reply-section">
                        <textarea [(ngModel)]="ticket.reply" placeholder="Escribe tu respuesta..."></textarea>
                        <button (click)="sendReply(ticket)" [disabled]="!ticket.reply">ENVIAR RESPUESTA</button>
                    </div>
                </div>
            }
        </div>
    </div>
  `,
    styles: [`
    .support-page { padding: 3rem 3rem 3rem calc(260px + 3rem); background: transparent; min-height: 100vh; color: white; }
    .title { font-weight: 900; font-size: 2.5rem; margin-bottom: 3rem; }
    .highlight { color: #F2E74B; }
    .tickets-grid { display: grid; gap: 2rem; }
    .ticket-card { background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 1.5rem; border: 1px solid #6C1DDA; }
    .ticket-card.open { border-color: #F2E74B; }
    .header { font-weight: 900; margin-bottom: 1rem; display: flex; justify-content: space-between; }
    .status-badge { background: #6C1DDA; padding: 0.2rem 0.5rem; border-radius: 0.3rem; font-size: 0.7rem; }
    .message { color: #ccc; margin-bottom: 2rem; font-style: italic; }
    .reply-section textarea { width: 100%; height: 80px; background: #000; color: white; border: 1px solid #444; border-radius: 0.5rem; padding: 0.5rem; margin-bottom: 1rem; }
    .reply-section button { background: #F2E74B; color: #1A0B2E; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: bold; cursor: pointer; }
  `]
})
export class AdminSupportComponent implements OnInit {
    tickets = signal<any[]>([]);
    private http = inject(HttpClient);

    ngOnInit() {
        this.http.get('https://takis.qrewards.com.mx/api/index.php/admin/support').subscribe((res: any) => this.tickets.set(res));
    }

    sendReply(ticket: any) {
        this.http.post(`https://takis.qrewards.com.mx/api/index.php/admin/support/${ticket.id}/reply`, { reply: ticket.reply }).subscribe(() => {
            alert('Respuesta enviada!');
            ticket.status = 'closed';
            ticket.reply = '';
        });
    }
}
