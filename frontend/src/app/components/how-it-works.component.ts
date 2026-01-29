import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNavbarComponent } from './user-navbar.component';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, UserNavbarComponent],
  template: `
    <user-navbar></user-navbar>
    
    <div class="page-container">
      <section class="how-it-works">
        <h2 class="takis-title">¿COMO <span class="highlight">FUNCIONA?</span></h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>Compra Takis</h3>
            <p>Busca tus Takis favoritos en cualquier tienda participante. Encuentra el codigo unico impreso dentro del empaque.</p>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>Canjea</h3>
            <p>Ingresa a tu cuenta, escribe el codigo y acumula puntos al instante. ¡Cada empaque te acerca mas a tu premio!</p>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>Gana</h3>
            <p>Visita nuestro catalogo, elige el premio que mas te guste y canjea tus puntos. ¡Es asi de sencillo!</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-container {
      padding-top: 100px;
      min-height: 100vh;
      background: transparent;
    }

    .how-it-works { 
      padding: 4rem 2rem; 
      text-align: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    


    .steps { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 3rem; 
    }

    .step { 
      background: #1c03387d;
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.2);
      border-radius: 2rem;
      padding: 3rem 2rem;
      transition: 0.4s;
    }

    .step:hover { 
      border-color: #F2E74B;
      transform: translateY(-10px);
      background: #57118cb5;
      backdrop-filter: blur(5px);
    }
    .step:active { transform: translateY(-5px) scale(0.98); }

    .step-number { 
      width: 80px; 
      height: 80px; 
      background: #F2E74B;
      color: #5d1f87; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-size: 2.5rem; 
      font-weight: 950; 
      margin: 0 auto 2rem auto;
      box-shadow: 0 10px 30px rgba(242, 231, 75, 0.3);
    }

    .step h3 { 
      color: white; 
      margin: 0 0 1.5rem 0; 
      font-size: 1.8rem;
      font-weight: 900;
    }

    .step p { 
      color: rgba(255, 255, 255, 0.8); 
      margin: 0;
      line-height: 1.6;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .how-it-works h2 { font-size: 2.2rem; }
      .steps { grid-template-columns: 1fr; }
    }
  `]
})
export class HowItWorksComponent { }
