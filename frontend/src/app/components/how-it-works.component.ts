import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserNavbarComponent } from './user-navbar.component';
import { WhatsappBubbleComponent } from './whatsapp-bubble.component';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, UserNavbarComponent, WhatsappBubbleComponent],
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
          
          <!-- Right: Mecanica Card -->
          <div class="hero-right mecanica-card">
            <h1 class="takis-title"><span class="highlight">MECÁNICA</span></h1>
            
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <h3>Compra Takis</h3>
                <p>Busca dentro del empaque de tus Takis favoritos los codigos participantes</p>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <h3>Canjea</h3>
                <p>Ingresa a tu cuenta, escribe el codigo y acumula puntos al instante</p>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <h3>Gana</h3>
                <p>Visita nuestro catalogo de recompensas y elige el que mas te guste. ¡Es asi de sencillo!</p>
              </div>
            </div>

            <!-- FAQs Section -->
            <div class="faqs-section">
              <h2 class="faqs-title">PREGUNTAS <span class="highlight">FRECUENTES</span></h2>
              
              <div class="faq-item" *ngFor="let faq of faqs; let i = index">
                <div class="faq-question" (click)="toggleFaq(i)">
                  <span>{{ faq.question }}</span>
                  <span class="faq-icon">{{ openFaqIndex === i ? '−' : '+' }}</span>
                </div>
                <div class="faq-answer" [class.open]="openFaqIndex === i">
                  <p>{{ faq.answer }}</p>
                </div>
              </div>
            </div>
          </div>

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

    .mecanica-card {
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

    .steps { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem; 
      width: 100%;
      margin-top: 2rem;
    }

    .step { 
      background: #1c03387d;
      backdrop-filter: blur(5px);
      border: 2px solid rgba(242, 231, 75, 0.2);
      border-radius: 2rem;
      padding: 2.5rem 1.5rem;
      transition: 0.4s;
    }

    .step:hover { 
      border-color: #F2E74B;
      transform: translateY(-10px);
      background: #57118cb5;
    }

    .step-number { 
      width: 70px; 
      height: 70px; 
      background: #F2E74B;
      color: #5d1f87; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-size: 2rem; 
      font-weight: 950; 
      margin: 0 auto 1.5rem auto;
      box-shadow: 0 10px 30px rgba(242, 231, 75, 0.3);
    }

    .step h3 { 
      color: white; 
      margin: 0 0 1rem 0; 
      font-size: 1.6rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .step p { 
      color: rgba(255, 255, 255, 0.8); 
      margin: 0;
      line-height: 1.5;
      font-size: 1.1rem;
    }

    /* FAQs Section */
    .faqs-section {
      width: 100%;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid rgba(242, 231, 75, 0.2);
    }

    .faqs-title {
      color: white;
      font-size: 2rem;
      font-weight: 900;
      text-transform: uppercase;
      margin-bottom: 2rem;
      text-align: center;
      text-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }

    .faq-item {
      background: #1c03387d;
      border: 2px solid rgba(242, 231, 75, 0.2);
      border-radius: 1rem;
      margin-bottom: 1rem;
      overflow: hidden;
      transition: 0.3s;
    }

    .faq-item:hover {
      border-color: rgba(242, 231, 75, 0.4);
    }

    .faq-question {
      padding: 1.5rem;
      color: white;
      font-weight: 900;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: 0.3s;
      user-select: none;
    }

    .faq-question:hover {
      background: rgba(242, 231, 75, 0.1);
    }

    .faq-icon {
      color: #F2E74B;
      font-size: 1.5rem;
      font-weight: 900;
      transition: 0.3s;
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background: rgba(0, 0, 0, 0.2);
    }

    .faq-answer.open {
      max-height: 500px;
      transition: max-height 0.5s ease-in;
    }

    .faq-answer p {
      padding: 1.5rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      line-height: 1.6;
      font-size: 1rem;
    }

    /* Mobile */
    .mobile-logo { display: none; }

    @media (max-width: 1100px) {
        .hero-flex { flex-direction: column; align-items: center; }
        .hero-left { position: relative; top: 0; margin-bottom: 2rem; flex: auto; max-width: 100%; }
        
        .desktop-logo { display: none; }
        .mobile-logo { display: block; width: 100%; height: auto; max-width: 250px; }
        
        .mecanica-card { padding: 2rem 1.5rem; min-height: auto; }
        .steps { grid-template-columns: 1fr; }
        
        .faqs-title { font-size: 1.5rem; }
        .faq-question { font-size: 1rem; padding: 1rem; }
        .faq-answer p { font-size: 0.9rem; padding: 1rem; }
    }
  `]
})
export class HowItWorksComponent {
  openFaqIndex: number | null = null;

  faqs = [
    {
      question: '¿Como puedo registrarme?',
      answer: 'Puedes registrarte haciendo clic en el boton "REGISTRATE" en la pagina principal. Solo necesitas tu correo electronico y crear una contrasena segura.'
    },
    {
      question: '¿Donde encuentro los codigos?',
      answer: 'Los codigos participantes se encuentran dentro del empaque de tus Takis favoritos. Busca el codigo impreso en el interior de la bolsa.'
    },
    {
      question: '¿Cuantos puntos vale cada codigo?',
      answer: 'Cada codigo tiene un valor en puntos que se acredita automaticamente a tu cuenta al momento de canjearlo. El valor puede variar segun la promocion.'
    },
    {
      question: '¿Como canjeo mis puntos por premios?',
      answer: 'Ve a la seccion "RECOMPENSAS" en el menu, selecciona el premio que desees y haz clic en "CANJEAR". Asegurate de tener suficientes puntos acumulados.'
    },
    {
      question: '¿Que hago si mi codigo no funciona?',
      answer: 'Verifica que hayas ingresado el codigo correctamente. Si el problema persiste, contacta a nuestro equipo de soporte a traves del boton de WhatsApp.'
    },
    {
      question: '¿Cuanto tiempo tardan en llegar los premios fisicos?',
      answer: 'Los premios fisicos se procesan en un plazo de 5 a 10 dias habiles. Recibiras un correo electronico con la informacion de seguimiento de tu envio.'
    }
  ];

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
