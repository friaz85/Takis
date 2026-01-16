import { Component, signal, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from './admin-navbar.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],
  template: `
    <app-admin-navbar></app-admin-navbar>
    <div class="orders-page">
      <h2 class="title">GESTIÓN DE <span class="highlight">PEDIDOS</span></h2>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>USUARIO</th>
              <th>PREMIO</th>
              <th>FECHA</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order.id) {
              <tr>
                <td>#{{ order.id }}</td>
                <td>{{ order.user_name }}</td>
                <td>{{ order.reward_title }}</td>
                <td>{{ order.created_at | date:'short' }}</td>
                <td>
                  <span class="badge" [class]="order.status">{{ order.status.toUpperCase() }}</span>
                </td>
                <td>
                  <select [(ngModel)]="order.status" (change)="updateStatus(order)">
                    <option value="pending">PENDIENTE</option>
                    <option value="processing">PROCESANDO</option>
                    <option value="shipped">ENVIADO</option>
                    <option value="delivered">ENTREGADO</option>
                  </select>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .orders-page { padding: 3rem 3rem 3rem calc(260px + 3rem); background: transparent; min-height: 100vh; color: white; }
    .title { font-weight: 900; font-size: 2.5rem; margin-bottom: 3rem; }
    .highlight { color: #F2E74B; }
    .table-container { background: rgba(255,255,255,0.05); border-radius: 1.5rem; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 1.5rem; background: rgba(108, 29, 218, 0.3); color: #F2E74B; font-weight: 900; }
    td { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .badge { padding: 0.3rem 0.8rem; border-radius: 0.5rem; font-size: 0.7rem; font-weight: 900; }
    .pending { background: #ffaa00; color: #1A0B2E; }
    .processing { background: #6C1DDA; color: white; }
    .shipped { background: #00aaff; color: white; }
    .delivered { background: #00ffaa; color: #1A0B2E; }
    select { background: #333; color: white; border: 1px solid #6C1DDA; padding: 0.5rem; border-radius: 0.5rem; outline: none; }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders = signal<any[]>([]);
  private http = inject(HttpClient);

  ngOnInit() {
    this.http.get('https://takis.qrewards.com.mx/api/index.php/admin/orders').subscribe((res: any) => {
      this.orders.set(res);
    });
  }

  updateStatus(order: any) {
    this.http.post(`https://takis.qrewards.com.mx/api/index.php/admin/orders/${order.id}/status`, { status: order.status }).subscribe();
  }
}
