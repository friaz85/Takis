import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AdminLayoutService } from '../services/admin-layout.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="admin-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
           <h2 class="title">SOPORTE AL CLIENTE</h2>
           <p class="subtitle">Gestiona mensajes e incidencias de los usuarios</p>
        </div>
        <div class="header-actions">
          <button class="export-btn secondary" (click)="exportToCSV()">
            <span class="icon">📥</span> <span class="btn-text">Exportar CSV</span>
          </button>
          <button class="export-btn" (click)="loadTickets()">
            <span class="icon">🔄</span> <span class="btn-text">Refrescar</span>
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header">
           <div class="search-box">
             <input 
               type="text" 
               [ngModel]="searchTerm()" 
               (ngModelChange)="searchTerm.set($event); currentPage = 1"
               placeholder="Buscar mensajes..."
             >
           </div>
        </div>

        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th class="hide-mobile">Asunto</th>
                <th>Mensaje</th>
                <th class="hide-mobile">Estado</th>
                <th class="text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ticket of paginatedTickets()" (click)="selectTicket(ticket)" class="clickable-row">
                <td class="font-bold">
                  {{ ticket.user_name }}
                  <small class="block text-gray">{{ ticket.user_email }}</small>
                </td>
                <td class="hide-mobile">{{ ticket.subject }}</td>
                <td class="message-cell">{{ ticket.message }}</td>
                <td class="hide-mobile">
                  <span class="status-pill" [class]="ticket.status">{{ 
                    ticket.status === 'open' ? 'Abierto' : 
                    ticket.status === 'in_progress' ? 'En Proceso' : 'Cerrado' 
                  }}</span>
                </td>
                <td class="text-right text-sm text-gray">{{ ticket.created_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="filteredTickets().length === 0">
                 <td colspan="5" class="text-center py-8 text-gray">No hay tickets de soporte</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" *ngIf="filteredTickets().length > 0">
          <div class="page-info">
             {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredTickets().length) }} de {{ filteredTickets().length }}
          </div>
          <div class="page-controls">
            <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">«</button>
            <span class="current-page">{{ currentPage }}</span>
            <button [disabled]="currentPage >= totalPages()" (click)="currentPage = currentPage + 1">»</button>
          </div>
        </div>
      </div>

      <!-- Ticket Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedTicket()">
        <div class="admin-modal">
           <div class="modal-header">
             <h3>Detalle de Ticket #{{ selectedTicket().id }}</h3>
             <button class="close-btn" (click)="selectedTicket.set(null)">✕</button>
           </div>
           
           <div class="modal-body">
              <div class="info-grid">
                <div class="info-item">
                  <label>Usuario</label>
                  <span>{{ selectedTicket().user_name }}</span>
                </div>
                <div class="info-item">
                  <label>Email</label>
                  <span>{{ selectedTicket().user_email }}</span>
                </div>
              </div>

              <div class="info-item full mt-4">
                <label>Asunto</label>
                <span class="subject-text">{{ selectedTicket().subject }}</span>
              </div>

              <div class="info-item full mt-4">
                <label>Mensaje del Usuario</label>
                <div class="message-box">{{ selectedTicket().message }}</div>
              </div>

              <hr class="divider">

              <div class="form-group mt-4">
                <label>Estado del Ticket</label>
                <select [(ngModel)]="selectedTicket().status">
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>

              <div class="form-group mt-4">
                <label>Comentario Administrativo / Respuesta</label>
                <textarea 
                  [(ngModel)]="selectedTicket().admin_comment" 
                  placeholder="Escribe un comentario interno o respuesta..."
                  rows="4"
                ></textarea>
              </div>
           </div>

           <div class="modal-footer">
             <button class="btn-cancel" (click)="selectedTicket.set(null)">Cerrar</button>
             <button class="export-btn" (click)="updateTicketStatus()">
                <span class="icon">💾</span> {{ saving() ? 'Guardando...' : 'Guardar Cambios' }}
             </button>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { 
      padding: 5rem 2rem 2rem 2rem; 
      margin-left: 260px;
      min-height: 100vh;
      background: #0D0221;
      color: white; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .admin-page.sidebar-closed { margin-left: 0; padding-top: 5rem; }

    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; }
    .title { font-weight: 900; font-size: 2rem; color: #F2E74B; margin: 0; }
    .subtitle { color: #ccc; margin: 0.5rem 0 0 0; }

    .export-btn { 
      background: #6C1DDA; border: none; color: white; padding: 0.75rem 1.5rem; 
      border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; 
      gap: 0.5rem; font-weight: bold; transition: 0.3s;
    }
    .export-btn { 
      background: #6C1DDA; border: none; color: white; padding: 0.75rem 1.5rem; 
      border-radius: 0.5rem; cursor: pointer; display: flex; align-items: center; 
      gap: 0.5rem; font-weight: bold; transition: 0.3s;
    }
    .export-btn .icon { color: #fff; }
    .export-btn:hover { background: #F2E74B; color: #1A0B2E; transform: translateY(-2px); }
    .export-btn:hover .icon { color: inherit; }

    .table-container { background: rgba(255,255,255,0.05); border: 2px solid #6C1DDA; border-radius: 1.5rem; overflow: hidden; }
    .table-header { padding: 1.5rem; border-bottom: 1px solid rgba(108, 29, 218, 0.2); }
    .search-box input {
      width: 100%; max-width: 400px; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA;
      color: white; padding: 0.8rem 1.2rem; border-radius: 0.5rem; outline: none;
    }

    .table-wrapper { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { background: rgba(108, 29, 218, 0.2); color: #F2E74B; padding: 1.2rem; text-align: left; font-size: 0.85rem; text-transform: uppercase; font-weight: 900; }
    .admin-table td { padding: 1.2rem; border-bottom: 1px solid rgba(108, 29, 218, 0.1); font-size: 0.9rem; }
    
    .message-cell { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #ccc; }
    .clickable-row { cursor: pointer; transition: 0.2s; }
    .clickable-row:hover { background: rgba(108, 29, 218, 0.1) !important; }

    .status-pill { padding: 0.3rem 0.8rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
    .status-pill.open { background: #ff4444; color: white; }
    .status-pill.in_progress { background: #ffaa00; color: #1A0B2E; }
    .status-pill.closed { background: #00cc66; color: white; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .admin-modal { background: #1A0B2E; border: 2px solid #6C1DDA; border-radius: 1.5rem; padding: 2.5rem; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
    
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .info-item label { display: block; color: #F2E74B; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; margin-bottom: 0.4rem; }
    .info-item span { color: white; font-size: 1rem; }
    .subject-text { font-weight: bold; font-size: 1.1rem !important; }
    .message-box { background: rgba(255,255,255,0.05); border-radius: 0.8rem; padding: 1rem; border: 1px solid rgba(108, 29, 218, 0.3); line-height: 1.6; max-height: 15rem; overflow-y: auto; }
    
    .divider { border: 0; border-top: 1px solid rgba(108, 29, 218, 0.2); margin: 2rem 0; }
    
    .form-group label { display: block; color: #F2E74B; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; margin-bottom: 0.6rem; }
    .form-group select, .form-group textarea { 
      width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA; color: white; 
      padding: 1rem; border-radius: 0.6rem; outline: none; font-size: 0.95rem; font-family: inherit;
    }
    .form-group textarea { resize: vertical; }

    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2.5rem; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; }

    .pagination { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .page-controls { display: flex; align-items: center; gap: 1rem; }
    .page-controls button { background: #6C1DDA; border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    
    .mt-4 { margin-top: 1rem; }
    .block { display: block; }

    @media (max-width: 1100px) {
      .admin-page { margin-left: 0; padding: 5rem 1rem 2rem 1rem; }
      .header-row { flex-direction: column; align-items: flex-start; }
      .search-box input { max-width: 100%; }
      .hide-mobile { display: none; }
      .btn-text { display: none; }
      .export-btn { border-radius: 50%; width: 45px; height: 45px; padding: 0; justify-content: center; }
    }
  `]
})
export class AdminSupportComponent implements OnInit {
  tickets = signal<any[]>([]);
  selectedTicket = signal<any>(null);
  searchTerm = signal('');
  currentPage = 1;
  pageSize = 10;
  saving = signal(false);
  Math = Math;

  private http = inject(HttpClient);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    const mockData = [
      { id: 1, user_name: 'Carlos Ruiz', user_email: 'carlos@example.com', subject: 'Seguimiento de envío', message: '¿Cuándo llegará mi sudadera? Ya pasaron 3 días.', status: 'open', admin_comment: '', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, user_name: 'Elena Gómez', user_email: 'elena@gmail.com', subject: 'Error en código', message: 'El código TAKI-XX-12 no funciona, dice que ya fue usado.', status: 'in_progress', admin_comment: 'Verificando con IT.', created_at: new Date(Date.now() - 172800000).toISOString() },
      { id: 3, user_name: 'Marcos Soto', user_email: 'msoto@outlook.com', subject: 'Sugerencia premios', message: 'Me gustaría ver tarjetas de Steam en el catálogo.', status: 'closed', admin_comment: 'Sugerencia tomada en cuenta.', created_at: new Date(Date.now() - 259200000).toISOString() },
      { id: 4, user_name: 'Lucía Méndez', user_email: 'lucia.m@prodigy.net', subject: 'Problema con perfil', message: 'No puedo actualizar mi dirección de entrega.', status: 'open', admin_comment: '', created_at: new Date(Date.now() - 345600000).toISOString() },
      { id: 5, user_name: 'Ricardo Paz', user_email: 'rpaz@gmail.com', subject: 'Felicitaciones', message: 'Me encantó la dinámica, ¡gracias por los audífonos!', status: 'closed', admin_comment: '', created_at: new Date(Date.now() - 432000000).toISOString() }
    ];

    this.http.get(`${environment.apiUrl}/admin/support`).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          this.tickets.set(res);
        } else {
          this.tickets.set(mockData);
        }
      },
      error: (e: any) => {
        console.error('API support error, using mock data:', e);
        this.tickets.set(mockData);
      }
    });
  }

  filteredTickets = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.tickets().filter((t: any) =>
      t.user_name?.toLowerCase().includes(term) ||
      t.subject?.toLowerCase().includes(term) ||
      t.message?.toLowerCase().includes(term)
    );
  });

  paginatedTickets = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTickets().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredTickets().length / this.pageSize));

  selectTicket(ticket: any) {
    this.selectedTicket.set({ ...ticket });
  }

  updateTicketStatus() {
    this.saving.set(true);
    const updated = this.selectedTicket();

    // Simulate API update
    setTimeout(() => {
      this.tickets.update(list => list.map(t => t.id === updated.id ? updated : t));
      this.saving.set(false);
      this.selectedTicket.set(null);
    }, 1000);
  }

  exportToCSV() {
    const headers = ['ID', 'Usuario', 'Email', 'Asunto', 'Estado', 'Fecha'];
    const rows = this.filteredTickets().map((t: any) => [
      t.id,
      `"${t.user_name}"`,
      t.user_email,
      `"${t.subject}"`,
      t.status,
      new Date(t.created_at).toLocaleString('es-MX')
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "soporte_takis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
