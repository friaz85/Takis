import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
           <h2 class="title">GESTIÓN DE USUARIOS</h2>
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
               (ngModelChange)="searchTerm.set($event); currentPage = 1"
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
                <th class="hide-mobile">Teléfono</th>
                <th class="hide-mobile">Ubicación</th>
                <th class="text-right">Fecha Registro</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of paginatedUsers()">
                <td class="font-bold">{{ user.full_name }}</td>
                <td>{{ user.email }}</td>
                <td class="hide-mobile">{{ user.phone || 'N/A' }}</td>
                <td class="hide-mobile">
                   {{ user.state || 'N/A' }}
                   <small class="block text-gray">{{ user.city }}</small>
                </td>
                <td class="text-right text-sm text-gray">{{ user.created_at | date:'short' }}</td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0">
                 <td colspan="5" class="text-center py-8 text-gray">No se encontraron usuarios</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="filteredUsers().length > 0">
          <div class="page-info">
             {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredUsers().length) }} de {{ filteredUsers().length }}
          </div>
          <div class="page-controls">
            <button [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">«</button>
            <span class="current-page">{{ currentPage }}</span>
            <button [disabled]="currentPage >= totalPages()" (click)="currentPage = currentPage + 1">»</button>
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
    .admin-table tr:hover { background: rgba(242, 231, 75, 0.05); }

    .pagination { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .page-controls { display: flex; align-items: center; gap: 1rem; }
    .page-controls button { background: #6C1DDA; border: none; color: white; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; }
    .page-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
    .current-page { font-weight: 900; color: #F2E74B; }

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
export class AdminUsersComponent implements OnInit {
  users = signal<any[]>([]);
  searchTerm = signal('');
  currentPage = 1;
  pageSize = 10;
  Math = Math;

  private http = inject(HttpClient);
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

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.users().filter((u: any) =>
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  paginatedUsers = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize));

  exportToCSV() {
    const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Estado', 'Ciudad', 'Dirección', 'Código Postal', 'Fecha Registro'];
    const rows = this.filteredUsers().map((u: any) => [
      u.id,
      `"${u.full_name}"`,
      u.email,
      u.phone || '',
      u.state || '',
      u.city || '',
      `"${u.address || ''}"`,
      u.zip_code || '',
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
