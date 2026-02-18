import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast.service';
import { AdminNavbarComponent } from './admin-navbar.component';
import { AdminLayoutService } from '../services/admin-layout.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="admin-page" [class.sidebar-closed]="!layoutService.isSidebarOpen()">
      <div class="header-row">
        <div>
           <h2 class="title">GESTION DE USUARIOS</h2>
           <p class="subtitle">Administra los participantes registrados</p>
        </div>
        <button class="export-btn" (click)="exportToCSV()">
           <span class="icon">📥</span> <span class="btn-text">Exportar CSV</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="table-container">
        <div class="table-header">
           <div class="search-box">
             <input 
               type="text" 
               [ngModel]="searchTerm()" 
               (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
               placeholder="Buscar por nombre o correo..."
             >
           </div>
        </div>

        <div class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th class="hide-mobile">Telefono</th>
                <th class="hide-mobile text-right">Puntos Acum.</th>
                <th class="hide-mobile text-right">Puntos Util.</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of paginatedUsers()">
                <td class="font-bold">{{ user.full_name }}</td>
                <td>{{ user.email }}</td>
                <td class="hide-mobile">{{ user.phone || 'N/A' }}</td>
                <td class="hide-mobile text-right font-bold text-yellow">{{ user.points_earned | number }}</td>
                <td class="hide-mobile text-right">{{ user.points_spent | number }}</td>
                <td>
                  <span class="status-badge" [class.blocked]="user.is_blocked == 1">
                    {{ user.is_blocked == 1 ? '🔒 Bloqueado' : '✅ Activo' }}
                  </span>
                </td>
                <td class="text-right">
                  <button 
                    class="action-btn" 
                    [class.unblock]="user.is_blocked"
                    (click)="openBlockModal(user)"
                  >
                    {{ user.is_blocked == 1 ? 'Desbloquear' : 'Bloquear' }}
                  </button>
                </td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0">
                 <td colspan="7" class="text-center py-8 text-gray">No se encontraron usuarios</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-footer" *ngIf="filteredUsers().length > 0">
          <span class="page-info">
             {{ (currentPage() - 1) * pageSize + 1 }} - {{ Math.min(currentPage() * pageSize, filteredUsers().length) }} DE {{ filteredUsers().length }}
          </span>
          <div class="pagination-controls">
            <button [disabled]="currentPage() === 1" (click)="setPage(currentPage() - 1)">«</button>
            <span class="page-number">{{ currentPage() }}</span>
            <button [disabled]="currentPage() >= totalPages()" (click)="setPage(currentPage() + 1)">»</button>
          </div>
        </div>
      </div>

      <!-- Block/Unblock Modal -->
      <div class="modal-overlay" *ngIf="selectedUser()" (click)="closeBlockModal($event)">
        <div class="block-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ selectedUser().is_blocked == 1 ? 'Desbloquear Usuario' : 'Bloquear Usuario' }}</h3>
            <button class="close-btn" (click)="closeBlockModal($event)">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="user-info">
              <p><strong>Usuario:</strong> {{ selectedUser().full_name }}</p>
              <p><strong>Email:</strong> {{ selectedUser().email }}</p>
            </div>

            <div class="form-group" *ngIf="selectedUser().is_blocked == 0">
              <label>Razon del Bloqueo</label>
              <textarea 
                [(ngModel)]="blockReason" 
                placeholder="Ej: Actividad sospechosa, multiples intentos fallidos, etc."
                rows="3"
                class="reason-textarea"
              ></textarea>
            </div>

            <div class="warning-box" *ngIf="selectedUser().is_blocked == 0">
              <p>⚠️ El usuario no podra acceder a su cuenta hasta que sea desbloqueado.</p>
            </div>

            <div class="info-box" *ngIf="selectedUser().is_blocked == 1">
              <p><strong>Razon del bloqueo:</strong> {{ selectedUser().blocked_reason || 'No especificada' }}</p>
              <p><strong>Bloqueado el:</strong> {{ selectedUser().blocked_at | date:'medium' }}</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeBlockModal($event)">Cancelar</button>
            <button 
              class="btn-action" 
              [class.unblock]="selectedUser().is_blocked"
              (click)="toggleUserBlock()"
              [disabled]="selectedUser().is_blocked == 0 && !blockReason"
            >
              {{ selectedUser().is_blocked == 1 ? '🔓 Desbloquear' : '🔒 Bloquear' }}
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
      background: #0d0221d6;
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
    .admin-table tr:hover { background: rgba(242, 231, 75, 0.05); }

    .pagination-footer { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(108, 29, 218, 0.2); }
    .page-info { font-weight: 900; color: white; font-size: 0.85rem; text-transform: uppercase; }
    .pagination-controls { display: flex; align-items: center; gap: 0.75rem; }
    .pagination-controls button { 
      width: 35px; height: 35px; border-radius: 50%; background: #3A1A5E; border: none; color: #F2E74B; 
      display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1.1rem; transition: 0.3s; 
    }
    .pagination-controls button:not(:disabled):hover { background: #6C1DDA; color: white; transform: scale(1.1); }
    .pagination-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-number { font-weight: 900; color: #F2E74B; font-size: 1.1rem; margin: 0 0.5rem; }

    .block { display: block; }
    .text-yellow { color: #F2E74B; }

    .status-badge {
      padding: 0.4rem 0.8rem; border-radius: 0.5rem; font-size: 0.75rem;
      font-weight: bold; background: #00cc66; color: white;
    }
    .status-badge.blocked { background: #ff3333; }

    .action-btn {
      background: #ff3333; border: none; color: white; padding: 0.5rem 1rem;
      border-radius: 0.5rem; cursor: pointer; font-size: 0.85rem; font-weight: bold;
      transition: 0.2s;
    }
    .action-btn:hover { background: #ff5555; transform: translateY(-2px); }
    .action-btn.unblock { background: #00cc66; }
    .action-btn.unblock:hover { background: #00dd77; }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .block-modal { background: #1A0B2E; border: 2px solid #6C1DDA; border-radius: 1.5rem; padding: 2rem; width: 100%; max-width: 500px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h3 { margin: 0; color: #F2E74B; }
    .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; transition: 0.2s; }
    .close-btn:hover { color: #F2E74B; transform: rotate(90deg); }
    
    .modal-body { margin-bottom: 1.5rem; }
    .user-info { background: rgba(108, 29, 218, 0.1); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    .user-info p { margin: 0.5rem 0; color: white; }
    
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .form-group label { color: #F2E74B; font-size: 0.85rem; font-weight: bold; }
    .reason-textarea { 
      width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #6C1DDA; color: white; 
      padding: 0.8rem; border-radius: 0.5rem; outline: none; font-family: inherit; resize: vertical;
    }
    
    .warning-box { background: rgba(255, 165, 0, 0.1); border: 1px solid #ffaa00; padding: 1rem; border-radius: 0.5rem; }
    .warning-box p { margin: 0; color: #ffaa00; font-size: 0.9rem; }
    
    .info-box { background: rgba(108, 29, 218, 0.1); border: 1px solid #6C1DDA; padding: 1rem; border-radius: 0.5rem; }
    .info-box p { margin: 0.5rem 0; color: white; font-size: 0.9rem; }
    
    .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #ccc; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; }
    .btn-action { background: #ff3333; border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; transition: 0.3s; }
    .btn-action:hover { background: #ff5555; }
    .btn-action.unblock { background: #00cc66; }
    .btn-action.unblock:hover { background: #00dd77; }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

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
export class AdminUsersComponent implements OnInit {
  users = signal<any[]>([]);
  selectedUser = signal<any>(null);
  blockReason = '';
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  Math = Math;
  dataVersion = signal(0);

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  private http = inject(HttpClient);
  private toast = inject(ToastService);
  public layoutService = inject(AdminLayoutService);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get(`${environment.apiUrl}/admin/users`).subscribe({
      next: (res: any) => this.users.set(res),
      error: (e: any) => console.error(e)
    });
  }

  openBlockModal(user: any) {
    this.selectedUser.set({ ...user });
    this.blockReason = '';
  }

  closeBlockModal(event: Event) {
    event.stopPropagation();
    this.selectedUser.set(null);
    this.blockReason = '';
  }

  toggleUserBlock() {
    const user = this.selectedUser();
    const isBlocking = !user.is_blocked;

    this.http.post(`${environment.apiUrl}/admin/users/${user.id}/toggle-block`, {
      block: isBlocking,
      reason: this.blockReason
    }).subscribe({
      next: () => {
        // Update local user list
        this.users.update(list => list.map(u => {
          if (u.id === user.id) {
            return {
              ...u,
              is_blocked: isBlocking ? 1 : 0,
              blocked_reason: isBlocking ? this.blockReason : null,
              blocked_at: isBlocking ? new Date().toISOString() : null
            };
          }
          return u;
        }));
        this.selectedUser.set(null);
        this.blockReason = '';
        this.toast.show(isBlocking ? '¡USUARIO BLOQUEADO EXITOSAMENTE!' : '¡USUARIO DESBLOQUEADO EXITOSAMENTE!', 'success');
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
        this.toast.show('ERROR AL ACTUALIZAR USUARIO.', 'error');
        this.selectedUser.set(null);
      }
    });
  }

  filteredUsers = computed(() => {
    this.dataVersion();
    const term = this.searchTerm().toLowerCase();
    return this.users().filter((u: any) =>
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  paginatedUsers = computed(() => {
    const data = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize));

  exportToCSV() {
    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Puntos Acumulados', 'Puntos Utilizados', 'Fecha Registro'];
    const rows = this.filteredUsers().map((u: any) => [
      u.id,
      `"${u.full_name}"`,
      u.email,
      u.phone || '',
      u.is_blocked == 1 ? 'Bloqueado' : 'Activo',
      u.points_earned || 0,
      u.points_spent || 0,
      u.created_at
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "usuarios_takis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
