import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserNavbarComponent } from './user-navbar.component';
import { WhatsappBubbleComponent } from './whatsapp-bubble.component';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';
import { AnalyticsService } from '../services/analytics.service';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-redeem-rewards',
  standalone: true,
  imports: [CommonModule, FormsModule, UserNavbarComponent, WhatsappBubbleComponent],
  template: `
    <user-navbar></user-navbar>
    <app-whatsapp-bubble></app-whatsapp-bubble>
    
    <div class="landing">
      <div class="hero">
        <div class="hero-flex">
          
          <!-- Left: Banderin -->
          <div class="hero-left">
             <div class="logo-wrapper">
               <img src="/assets/img/Banderin-completo.png" alt="Takis" class="takis-logo desktop-logo animate__animated animate__zoomIn">
               <img src="/assets/img/Banderin_01.png" alt="Takis" class="takis-logo mobile-logo animate__animated animate__zoomIn">
             </div>
          </div>
          
          <!-- Right: Catalog Card -->
          <div class="hero-right catalog-card">
            
            <!-- Scoreboard Points Display -->
            <div class="scoreboard">
                <div class="score-end left-end"></div>
                <div class="score-bar">
                    <span class="score-label">TIENES</span>
                    
                    <div class="score-center-spacer"></div>

                    <span class="score-label">PUNTOS</span>
                    
                    <div class="score-center">
                        <span class="score-value">{{ userPoints() | number:'1.0-0' }}</span>
                    </div>
                </div>
                <div class="score-end right-end"></div>
            </div>

            <h2 class="catalog-title">CATALOGO DE RECOMPENSAS</h2>
            <p class="catalog-disclaimer">*Imágenes de referencia, los productos pueden variar en color, tamaño, modelo y marca.</p>

            <div *ngIf="loading()" class="loading-state">
                <div class="spinner"></div>
                <p>CARGANDO RECOMPENSAS...</p>
            </div>

            <div class="rewards-grid custom-scroll" *ngIf="!loading()">
              <div class="reward-item" *ngFor="let item of filteredRewards()" (click)="redeem(item)">
                <div class="reward-img-container">
                    <img [src]="item.image_url ? environment.uploadsUrl + '/rewards/' + item.image_url : 'assets/takis-piece.png'" [alt]="item.title">
                </div>
                <h3 class="reward-title">{{ item.title }}</h3>
                <div class="reward-pts">{{ item.cost }} PUNTOS</div>
                
                <!-- Stock Badge or Overlay -->
                <div class="overlay-hover">
                    <span>{{ item.cost <= userPoints() ? 'CANJEAR' : 'FALTAN PUNTOS' }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="filteredRewards().length === 0 && !loading()">
              <h2>SIN RESULTADOS</h2>
              <p>{{ activeFilter() === 'redeemable' ? 'Aun no tienes puntos suficientes.' : 'No hay recompensas disponibles.' }}</p>
            </div>
            
             <!-- Corner Logo (Desktop Only) -->
            <img src="/assets/img/Logo-Takis.png" class="corner-logo" alt="Takis Logo">
          </div>

        </div>
      </div>
    </div>

    <!-- Address Modal -->
    <div class="modal-overlay" *ngIf="showAddressModal()">
      <div class="modal-card" [style.backgroundImage]="'linear-gradient(rgba(86, 14, 140, 0.9), rgba(86, 14, 140, 0.8)), url(/assets/img/BG_soccer.jpg)'">
        <button class="close-btn-round" (click)="closeModal()">X</button>
        <div class="modal-body">
          <h2 class="modal-title-yellow">ENVIO DE PREMIO</h2>
          <p class="modal-subtitle-white">Para enviarte tu <strong>{{ pendingReward()?.title }}</strong> necesitamos completar tus datos de envio.</p>
          
          <form (ngSubmit)="submitAddress()">
            <div class="form-grid">
              <div class="form-group full">
                <label>NOMBRE COMPLETO</label>
                <input type="text" [(ngModel)]="addressForm.full_name" name="full_name" required placeholder="NOMBRE COMPLETO" readonly style="opacity: 0.7; cursor: not-allowed;">
              </div>

               <div class="form-group full">
                 <label>NOMBRE DE QUIEN RECIBE</label>
                 <input type="text" [(ngModel)]="addressForm.recipient_name" name="recipient_name" placeholder="NOMBRE QUIEN RECIBE" [disabled]="addressLocked()">
               </div>
 
               <div class="form-group full">
                 <label>CALLE Y NUMERO</label>
                 <input type="text" [(ngModel)]="addressForm.address" name="address" required placeholder="CALLE Y NUMERO" [disabled]="addressLocked()">
               </div>
               
               <div class="form-group">
                 <label>COLONIA</label>
                 <input type="text" [(ngModel)]="addressForm.colonia" name="colonia" required placeholder="COLONIA" [disabled]="addressLocked()">
               </div>
               
               <div class="form-group">
                 <label>ALCALDIA / MUNICIPIO</label>
                 <input type="text" [(ngModel)]="addressForm.municipio" name="municipio" required placeholder="MUNICIPIO" [disabled]="addressLocked()">
               </div>
 
               <div class="form-group">
                 <label>ESTADO</label>
                 <select [(ngModel)]="addressForm.state" name="state" required class="select-flat-modal" [disabled]="addressLocked()">
                     <option value="" disabled selected>SELECCIONA UN ESTADO</option>
                     <option *ngFor="let st of mexicoStates" [value]="st">{{ st | uppercase }}</option>
                 </select>
               </div>
 
               <div class="form-group">
                 <label>CODIGO POSTAL</label>
                 <input type="text" [(ngModel)]="addressForm.zip_code" name="zip_code" required maxlength="5" placeholder="CP" [disabled]="addressLocked()">
               </div>
 
               <div class="form-group">
                 <label>TELEFONO DE CONTACTO</label>
                 <input type="text" [(ngModel)]="addressForm.phone" name="phone" required maxlength="10" placeholder="10 DIGITOS" [disabled]="addressLocked()">
               </div>
 
               <div class="form-group full">
                 <label>INSTRUCCIONES DE ENTREGA</label>
                 <textarea [(ngModel)]="addressForm.delivery_instructions" name="delivery_instructions" class="textarea-flat-modal" placeholder="INSTRUCCIONES ADICIONALES PARA LA ENTREGA" [disabled]="addressLocked()"></textarea>
               </div>
            </div>

            <button type="submit" class="takis-btn-primary block" [disabled]="submittingAddress() || processingId()">
              {{ submittingAddress() ? 'GUARDANDO...' : (processingId() ? 'PROCESANDO CANJE...' : 'GUARDAR Y CANJEAR') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing { 
      min-height: 100vh; 
      width: 100vw;
      background: transparent; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      overflow-x: hidden;
      overflow-y: auto;
      position: relative;
      padding-top: 80px;
    }

    .hero { 
      padding: 1rem 2rem 4rem 2rem; 
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      z-index: 10;
    }

    .hero-flex {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 2rem;
    }

    .hero-left { flex: 0 0 300px; display: flex; justify-content: center; position: sticky; top: 100px; }
    
    .takis-logo { 
      width: 100%;
      height: auto;
      max-height: 85vh;
      object-fit: contain;
    }

    .hero-right {
      flex: 1;
      width: 100%;
    }

    .catalog-card {
      background: rgba(86, 14, 140, 0.8);
      border-radius: 2rem;
      padding: 3rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
      position: relative;
      border: 1px solid rgba(242, 231, 75, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 600px;
    }

    /* Scoreboard Styles */
    .scoreboard {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        max-width: 600px;
        margin-bottom: 3rem;
        position: relative;
    }

    .score-bar {
        flex: 1;
        height: 60px;
        background: linear-gradient(to bottom, #f0f0f0 0%, #d9d9d9 50%, #bfbfbf 100%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
        border-top: 2px solid white;
        border-bottom: 2px solid #999;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
    }

    .score-end {
        width: 50px;
        height: 60px;
        background: linear-gradient(180deg, #9b4db3 0%, #560E8C 100%);
        border: 2px solid #ccc;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
    }
    .left-end { border-radius: 10px 0 0 10px; border-right: none; }
    .right-end { border-radius: 0 10px 10px 0; border-left: none; }

    .score-label {
        color: #1A0B2E;
        font-weight: 900;
        font-size: 1.2rem;
        text-transform: uppercase;
        flex: 1;
        text-align: center;
    }
    
    .score-center-spacer { flex: 0 0 140px; }

    .score-center {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 140px;
        height: 90px;
        background: radial-gradient(circle at center, #8e44ad 0%, #560E8C 100%);
        background-image: radial-gradient(#a569bd 1px, transparent 1px), radial-gradient(circle at center, #8e44ad 0%, #560E8C 100%);
        background-size: 4px 4px, 100% 100%;
        border: 2px solid #ccc;
        border-radius: 0 0 40px 40px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        overflow: hidden;
    }

    /* Shine effect for score-center */
    .score-center::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: shine-center 5s infinite;
    }
    
    @keyframes shine-center {
        0% { left: -100%; }
        100% { left: 200%; }
    }

    .score-value {
        font-size: 2.5rem;
        font-weight: 900;
        background: linear-gradient(to bottom, #fff 0%, #ccc 50%, #fff 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.5));
        white-space: nowrap;
    }

    .catalog-title {
        color: #f2e74b;
        font-size: 3rem !important;
        margin-top: 0px !important;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 1rem;
        text-shadow: 0 4px 10px rgba(0, 0, 0, .5);
        letter-spacing: 2px;
        background: url(/assets/img/texture-gold.jpg);
        -webkit-background-clip: text;
    }

    .catalog-disclaimer {
        color: white;
        font-size: 0.85rem;
        margin-top: 0.5rem;
        margin-bottom: 2rem;
        opacity: 1;
        font-family: inherit;
    }

    .rewards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 2rem 1rem;
        width: 100%;
        padding-right: 0.5rem;
    }
    
    .reward-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: 0.3s;
        cursor: pointer;
        position: relative;
        padding: 1rem;
        border-radius: 1rem;
    }
    .reward-item:hover { 
        background: rgba(255,255,255,0.05);
        transform: translateY(-5px); 
    }

    .reward-img-container {
        width: 100%;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.8rem;
    }
    .img-fluid, .reward-img-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));
    }

    .reward-title {
        color: white;
        font-size: 0.85rem;
        font-weight: 900;
        text-transform: uppercase;
        margin-bottom: 0.3rem;
        line-height: 1.2;
        min-height: 2.4em;
    }

    .reward-pts {
        color: #F2E74B;
        font-size: 0.8rem;
        font-weight: 900;
        text-transform: uppercase;
    }
    
    .overlay-hover {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: #1f0235c7;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: 0.3s;
    }
    .reward-item:hover .overlay-hover { opacity: 1; }
    .overlay-hover span {
        color: #F2E74B;
        font-weight: 900;
        text-transform: uppercase;
        border: 2px solid #F2E74B;
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        background: rgba(0,0,0,0.5);
    }

    .corner-logo {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: auto;
      filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));
      z-index: 10;
    }

    .loading-state, .empty-state { text-align: center; color: white; padding: 3rem; grid-column: 1/-1; }
    .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #F2E74B; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Scroll */
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #560E8C; border-radius: 3px; }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); z-index: 2000;
      display: flex; align-items: flex-start; justify-content: center;
      backdrop-filter: blur(8px);
      overflow-y: auto;
      padding: 2rem 0;
    }
    .modal-card {
      background: #1A0B2E;
      background-size: cover;
      background-position: center;
      border: 2px solid #F2E74B;
      border-radius: 1.5rem;
      padding: 3rem 2rem;
      width: 90%; max-width: 650px;
      position: relative;
      box-shadow: 0 0 50px rgba(0,0,0,0.8);
      margin: auto;
    }
    .modal-title-yellow {
        color: #F2E74B;
        font-weight: 900;
        text-transform: uppercase;
        font-size: 2.2rem;
        margin-bottom: 0.5rem;
        text-align: center;
    }
    .modal-subtitle-white {
        color: white;
        text-align: center;
        margin-bottom: 2rem;
        font-size: 1rem;
        opacity: 0.9;
    }
    .close-btn-round {
        position: absolute;
        top: -15px;
        right: -15px;
        width: 40px;
        height: 40px;
        background: #F2E74B;
        border: none;
        border-radius: 50%;
        color: #560E8C;
        font-weight: 900;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 1001;
        transition: 0.2s;
    }
    .close-btn-round:hover { transform: scale(1.1); background: white; }
    
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { color: white; font-size: 0.85rem; font-weight: 900; margin-bottom: 0.5rem; text-transform: uppercase; }
    .form-group input, .select-flat-modal, .textarea-flat-modal { 
        background: rgba(255,255,255,0.15); 
        border: 2px solid rgba(255,255,255,0.1); 
        color: white; 
        padding: 0.8rem; 
        border-radius: 0.8rem; 
        transition: 0.3s; 
        outline: none; 
        font-weight: bold;
    }
    .form-group input::placeholder { color: rgba(255,255,255,0.4); }
    .form-group input:focus, .select-flat-modal:focus, .textarea-flat-modal:focus { 
        border-color: #F2E74B; 
        background: rgba(255,255,255,0.2); 
    }

    .form-group input:disabled, .form-group select:disabled, .form-group textarea:disabled {
        background: rgba(255, 255, 255, 0.1) !important;
        cursor: not-allowed;
        opacity: 0.7;
        color: #bbb !important;
    }

    .select-flat-modal {
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23F2E74B' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 1rem center;
        background-size: 1rem;
        padding-right: 2.5rem;
        font-family: inherit;
    }

    .textarea-flat-modal {
        min-height: 80px;
        resize: none;
        font-family: inherit;
    }
    
    .takis-btn-primary { 
      background: #F2E74B; color: #5d1f87; border: none; 
      padding: 1.2rem; border-radius: 1.5rem; 
      font-weight: 900; font-size: 1.5rem; width: 100%; 
      cursor: pointer; text-transform: uppercase; transition: 0.3s;
      font-family: 'TakisVeneer', 'Inter', sans-serif;
      box-shadow: 0 8px 0 #b8af2e;
      position: relative;
    }
    .takis-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 0 #b8af2e; }
    .takis-btn-primary:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 2px 0 #b8af2e; }
    .takis-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    /* SweetAlert Button Custom Classes */
    ::ng-deep .takis-swal-confirm {
      background: #F2E74B !important;
      color: #5d1f87 !important;
      border-radius: 1.5rem !important;
      padding: 1rem 2.2rem !important;
      font-weight: 900 !important;
      font-size: 1.4rem !important;
      text-transform: uppercase !important;
      box-shadow: 0 8px 0 #b8af2e !important;
      font-family: 'TakisVeneer', 'Inter', sans-serif !important;
      border: none !important;
      margin: 10px !important;
      cursor: pointer !important;
      transition: 0.1s;
    }
    ::ng-deep .takis-swal-confirm:hover { transform: translateY(-2px); box-shadow: 0 10px 0 #b8af2e !important; }
    ::ng-deep .takis-swal-confirm:active { transform: translateY(4px); box-shadow: 0 2px 0 #b8af2e !important; }

    ::ng-deep .takis-swal-cancel {
      background: transparent !important;
      color: #F2E74B !important;
      border: 4px solid #F2E74B !important;
      border-radius: 1.5rem !important;
      padding: 0.8rem 2rem !important;
      font-weight: 900 !important;
      font-size: 1.4rem !important;
      text-transform: uppercase !important;
      font-family: 'TakisVeneer', 'Inter', sans-serif !important;
      margin: 10px !important;
      cursor: pointer !important;
      transition: 0.1s;
    }
    ::ng-deep .takis-swal-cancel:hover { background: rgba(242, 231, 75, 0.1); transform: translateY(-2px); }

    /* Responsive */
    .mobile-logo { display: none; }

    @media (max-width: 992px) {
        .hero-flex { flex-direction: column; align-items: center; }
        .hero-left { position: relative; top: 0; margin-bottom: 2rem; flex: auto; max-width: 100%; }
        
        .desktop-logo { display: none; }
        .mobile-logo { display: block; width: 100%; height: auto; max-width: 280px; }
        .corner-logo { display: none; }
        
        .catalog-card { padding: 2rem 1rem; min-height: auto; }
        .rewards-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1rem; }
        
        /* Scoreboard Responsive Fixes */
        .scoreboard { transform: scale(0.9); width: 100%; }
        .score-bar { padding: 0 0.5rem; }
        .score-label { font-size: 0.8rem; letter-spacing: 0; }
        .score-center-spacer { flex: 0 0 110px; }
        .score-center { width: 110px; height: 75px; }
        .score-value { font-size: 2rem; }

        .catalog-title { font-size: 2rem; }
        
        .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class RedeemRewardsComponent implements OnInit {
  rewards = signal<any[]>([]);
  activeFilter = signal<'all' | 'redeemable'>('all');
  userPoints = signal(0);
  loading = signal(true);
  processingId = signal<number | null>(null);
  addressLocked = signal(false);

  mexicoStates = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
    'Chihuahua', 'Ciudad de Mexico', 'Coahuila', 'Colima', 'Durango', 'Estado de Mexico',
    'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacan', 'Morelos', 'Nayarit',
    'Nuevo Leon', 'Oaxaca', 'Puebla', 'Queretaro', 'Quintana Roo', 'San Luis Potosi',
    'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatan', 'Zacatecas'
  ];

  // Modal State
  showAddressModal = signal(false);
  submittingAddress = signal(false);
  pendingReward = signal<any>(null);
  addressForm: any = {
    full_name: '',
    recipient_name: '',
    address: '',
    colonia: '',
    municipio: '',
    state: '',
    zip_code: '',
    phone: '',
    delivery_instructions: ''
  };

  environment = environment;

  filteredRewards = computed(() => {
    const filter = this.activeFilter();
    const pts = this.userPoints();
    const all = [...this.rewards()]; // Create shallow copy for sorting

    // Sort by cost ASC
    all.sort((a, b) => a.cost - b.cost);

    if (filter === 'redeemable') {
      return all.filter(r => r.cost <= pts && r.stock > 0);
    }
    return all;
  });

  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private auth = inject(AuthService);
  private analytics = inject(AnalyticsService);
  private router = inject(Router);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    // Use auth.getProfile if available to ensure token usage, or http directly
    this.http.get(`${environment.apiUrl}/profile`).subscribe({
      next: (profile: any) => {
        // Fix: ProfileController returns user object directly, but we support {user: ...} just in case
        const user = profile.user || profile;
        const userPoints = user.points;
        this.userPoints.set(parseInt(userPoints || 0));

        // Pre-fill form just in case
        this.addressForm = {
          full_name: user.full_name || user.name || '',
          recipient_name: user.recipient_name || '',
          address: user.address || '',
          colonia: user.colonia || '',
          municipio: user.municipio || '',
          state: user.state || '',
          zip_code: user.zip_code || '',
          phone: user.phone || '',
          delivery_instructions: user.delivery_instructions || ''
        };

        const isComplete = !!(
          this.addressForm.full_name?.toString().trim() &&
          this.addressForm.recipient_name?.toString().trim() &&
          this.addressForm.address?.toString().trim() &&
          this.addressForm.colonia?.toString().trim() &&
          this.addressForm.municipio?.toString().trim() &&
          this.addressForm.state?.toString().trim() &&
          this.addressForm.zip_code?.toString().trim() &&
          this.addressForm.phone?.toString().trim()
        );
        this.addressLocked.set(isComplete);
        console.log('Address form complete check:', isComplete, this.addressForm);

        this.http.get(`${environment.apiUrl}/rewards`).subscribe({
          next: (res: any) => {
            // Ensure cost is number for proper filtering
            const formattedRewards = Array.isArray(res) ? res.map((r: any) => ({
              ...r,
              cost: Number(r.cost),
              stock: Number(r.stock)
            })).sort((a: any, b: any) => a.cost - b.cost) : [];

            this.rewards.set(formattedRewards);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  redeem(reward: any) {
    if (this.processingId()) return;
    if (reward.cost > this.userPoints()) {
      Swal.fire({
        title: 'Puntos insuficientes',
        text: `Te faltan ${reward.cost - this.userPoints()} puntos para canjear este premio.`,
        icon: 'warning',
        confirmButtonColor: '#6C1DDA'
      });
      return;
    }
    if (reward.stock <= 0) {
      Swal.fire({
        title: 'Agotado',
        text: 'Lo sentimos, este producto ya no tiene existencias.',
        icon: 'error',
        confirmButtonColor: '#6C1DDA'
      });
      return;
    }

    Swal.fire({
      title: '¿CONFIRMAR CANJE?',
      text: `¿Deseas canjear ${reward.title} por ${reward.cost} puntos?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'SÍ, CANJEAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#6C1DDA',
      cancelButtonColor: '#ff4444',
      background: '#1A0B2E',
      color: '#fff',
      customClass: {
        popup: 'takis-swal-popup',
        confirmButton: 'takis-swal-confirm',
        cancelButton: 'takis-swal-cancel'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeRedemption(reward);
      }
    });
  }

  private executeRedemption(reward: any) {
    this.processingId.set(reward.id);

    this.http.post(`${environment.apiUrl}/redeem`, { reward_id: reward.id }).subscribe({
      next: (res: any) => {
        // Optimistic update
        this.userPoints.update(p => p - reward.cost);

        // Success: Close modal if it was open
        this.showAddressModal.set(false);
        this.submittingAddress.set(false);
        this.pendingReward.set(null);

        const isDigital = reward.type === 'digital';
        const successTitle = '¡CANJE EXITOSO!';
        const successText = isDigital
          ? 'A continuación visualizarás tu cupón digital, recuerda guardarlo o tomarle captura, también lo puedes descargar más adelante en la sección HISTORIAL.'
          : 'A continuación recibirás un correo de confirmación con tu número de PEDIDO y también puedes consultar estatus en la sección HISTORIAL.';

        Swal.fire({
          title: successTitle,
          text: successText,
          icon: 'success',
          confirmButtonColor: '#F2E74B',
          confirmButtonText: 'ENTENDIDO',
          customClass: {
            confirmButton: 'takis-swal-confirm'
          },
          buttonsStyling: false
        }).then(() => {
          if (isDigital && res.pdf_url) {
            window.open(res.pdf_url, '_blank');
          }
        });

        this.processingId.set(null);
        this.analytics.trackConversion('redemption', res.order_id || reward.id, {
          rewardTitle: reward.title,
          rewardPoints: reward.cost
        });

        // Reload to sync
        this.loadData();
      },
      error: (err) => {
        this.processingId.set(null);
        this.submittingAddress.set(false); // Release button in modal if open
        console.error('Redeem Error', err);

        const errorCode = err.error?.error || err.error?.code || err.error?.messages?.code;
        if (errorCode === 'PROFILE_INCOMPLETE') {
          this.pendingReward.set(reward);
          this.showAddressModal.set(true);
          const msg = err.error?.message || (err.error?.messages ? (typeof err.error.messages === 'object' ? err.error.messages.error : err.error.messages) : null);
          if (msg) this.toast.show(msg, 'info', 6000);
          return;
        }

        let msg = err.error?.message;
        if (!msg && err.error?.messages) {
          msg = typeof err.error.messages === 'object' ? err.error.messages.error : err.error.messages;
        }
        if (!msg) msg = 'Error al canjear. Intenta de nuevo.';

        Swal.fire({
          title: 'ERROR',
          text: msg,
          icon: 'error',
          confirmButtonText: 'CERRAR',
          customClass: {
            confirmButton: 'takis-swal-confirm'
          },
          buttonsStyling: false
        });
      }
    });
  }

  closeModal() {
    this.showAddressModal.set(false);
    this.pendingReward.set(null);
  }

  submitAddress() {
    if (this.submittingAddress()) return;

    // Basic validation
    if (!this.addressForm.address || !this.addressForm.phone || !this.addressForm.zip_code || !this.addressForm.state || !this.addressForm.municipio || !this.addressForm.colonia) {
      this.toast.show('Por favor completa todos los campos de envío', 'info');
      return;
    }

    this.submittingAddress.set(true);

    // Sync city with municipio just in case
    this.addressForm.city = this.addressForm.municipio;

    // Update Profile First
    this.http.post(`${environment.apiUrl}/profile`, this.addressForm).subscribe({
      next: (res: any) => {
        this.toast.show('Direccion guardada exitosamente', 'success');

        // Lock if now complete
        const isNowComplete = !!(
          this.addressForm.full_name?.toString().trim() &&
          this.addressForm.recipient_name?.toString().trim() &&
          this.addressForm.address?.toString().trim() &&
          this.addressForm.colonia?.toString().trim() &&
          this.addressForm.municipio?.toString().trim() &&
          this.addressForm.state?.toString().trim() &&
          this.addressForm.zip_code?.toString().trim() &&
          this.addressForm.phone?.toString().trim()
        );
        this.addressLocked.set(isNowComplete);
        console.log('Address form update lock check:', isNowComplete);

        // Retry Redemption immediately without closing the modal first (avoid flickering)
        const pending = this.pendingReward();
        if (pending) {
          this.executeRedemption(pending);
        } else {
          this.showAddressModal.set(false);
          this.submittingAddress.set(false);
        }
      },
      error: (err) => {
        console.error('Update Profile Error', err);
        this.submittingAddress.set(false);
        this.toast.show('Error al guardar la direccion. Intenta de nuevo.', 'error');
      }
    });
  }
}
