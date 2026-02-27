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
                <img src="/assets/img/01.png" class="step-number-img" alt="Paso 1">
                <h3>Compra Takis</h3>
                <p>Busca dentro del empaque de tus Takis favoritos los códigos participantes</p>
              </div>
              <div class="step">
                <img src="/assets/img/02.png" class="step-number-img" alt="Paso 2">
                <h3>Canjea</h3>
                <p>Ingresa a tu cuenta, escribe el código y acumula puntos al instante</p>
              </div>
              <div class="step">
                <img src="/assets/img/03.png" class="step-number-img" alt="Paso 3">
                <h3>Gana</h3>
                <p>Visita nuestro catálogo de recompensas y elige el que más te guste. ¡Es así de sencillo!</p>
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

    .step-number-img { 
      width: 100px; 
      height: auto; 
      margin: 0 auto 1.5rem auto;
      display: block;
      filter: drop-shadow(0 5px 15px rgba(242, 231, 75, 0.3));
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
      font-size: clamp(1.5rem, 5vw, 2.3rem);
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
      white-space: pre-wrap;
    }

    /* Mobile */
    .mobile-logo { display: none; }

    @media (max-width: 1100px) {
        .hero { padding: 1rem 0.5rem 4rem 0.5rem; }
        .hero-flex { flex-direction: column; align-items: center; gap: 1rem; }
        .hero-left { position: relative; top: 0; margin-bottom: 2rem; flex: auto; max-width: 100%; }
        
        .desktop-logo { display: none; }
        .mobile-logo { display: block; width: 100%; height: auto; max-width: 250px; }
        
        .mecanica-card { padding: 2rem 1rem; min-height: auto; border-radius: 1.5rem; }
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
      question: '¿Cuál es la vigencia de la promoción?',
      answer: 'La promoción tiene una vigencia del 16 de febrero al 30 de abril del 2026'
    },
    {
      question: '¿Qué productos participan?',
      answer: `Participan los productos Takis marcados con el logo de la campaña Takis: La Botana de la Afición más Intensa, los cuales son:
Canal Detalle: Takis Fuego 70g, Takis Blue Heat 70g, Takis Huakamoles 70g, Takis Salsa Brava 70g, Takis Original 70g, Takis Chile Limón 70g, Takis Intense Nacho 70g y Takis Fuego 200g.
Canal Conveniencia: Takis Fuego 80g, 200g y 260g.
Canal Autoservicios: Takis Fuego 240g.`
    },
    {
      question: '¿Cómo puedo registrarme?',
      answer: 'Puedes registrarte haciendo click en el botón "REGISTRARME" en la página principal. Solamente necesitas tu correo electrónico y número de teléfono. Asegúrate de ponerlos de manera correcta.'
    },
    {
      question: '¿Dónde encuentro los códigos?',
      answer: 'Los códigos participantes se encuentran en la tira que viene dentro del empaque de los productos Takis participantes. Busca el código y acumula puntos.'
    },
    {
      question: '¿Cuántos puntos vale cada código?',
      answer: 'Cada código registrado equivale a 1 punto. Este valor se acredita automáticamente a tu cuenta al momento de registrarlo.'
    },
    {
      question: '¿Cómo canjeo mis puntos por premios?',
      answer: 'Una vez que acumules los puntos necesarios, ve a la sección de recompensas dentro de la plataforma, selecciona el producto (premio) que desees del catálogo y confirma tu elección.'
    },
    {
      question: '¿Qué hago si mi código no funciona?',
      answer: 'Verifica que hayas ingresado el código correctamente. Recuerda que hay un límite de registro de 20 códigos por día. Si el problema persiste, contacta a soporte vía WhatsApp al 55 3875 9528.'
    },
    {
      question: '¿Cuánto tiempo tardan en llegar los premios físicos?',
      answer: 'Los premios físicos se entregan en un plazo de 8 a 15 días hábiles después de que realices el canje y confirmes tus datos personales. Recibirás un folio para dar seguimiento a tu envío.'
    },
    {
      question: '¿Qué pasa si gano un premio digital?',
      answer: 'Los incentivos digitales se descargan al momento del canje, de igual manera puedes consultarlos en la sección historial.'
    }
  ];

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
