import { Component, signal, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="countdown-overlay" (click)="close()">
      <div class="countdown-modal" (click)="$event.stopPropagation()">
        <button class="close-btn" (click)="close()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div class="modal-body">
          <div class="image-container">
            <img src="assets/img/promo-cierre.jpg" alt="Promo Cierre" class="promo-img">
            
            <!-- Countdown Overlay -->
            <div class="countdown-timer-overlay">
              <div class="timer-item">
                <div class="time-box">{{ days() }}</div>
                <div class="time-label">DÍAS</div>
              </div>
              
              <div class="timer-separator">:</div>
              
              <div class="timer-item">
                <div class="time-box">{{ hours() }}</div>
                <div class="time-label">HORAS</div>
              </div>
              
              <div class="timer-separator">:</div>
              
              <div class="timer-item">
                <div class="time-box">{{ minutes() }}</div>
                <div class="time-label">MINUTOS</div>
              </div>
              
              <div class="timer-separator">:</div>
              
              <div class="timer-item">
                <div class="time-box">{{ seconds() }}</div>
                <div class="time-label">SEGUNDOS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .countdown-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(26, 11, 46, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: fadeIn 0.4s ease-out;
    }

    .countdown-modal {
      position: relative;
      width: 90%;
      max-width: 500px;
      background: transparent;
      border-radius: 1.5rem;
      padding: 0;
      box-shadow: 0 30px 60px rgba(0,0,0,0.8);
      animation: scaleUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: visible;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .modal-body {
      position: relative;
      border-radius: 1.5rem;
      overflow: hidden;
      border: 3px solid #F2E74B;
      box-shadow: 0 0 30px rgba(242, 231, 75, 0.2);
      flex: 1;
      display: flex;
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .promo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .countdown-timer-overlay {
      position: absolute;
      bottom: 22%; /* Raised higher up */
      left: 0;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 1rem;
      gap: 0.4rem;
      z-index: 10;
    }

    .timer-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 80px;
    }

    .time-box {
      width: 100%;
      aspect-ratio: 1/1;
      background: rgba(255, 255, 255, 0.15); /* Semi-transparent */
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'TakisVeneer', sans-serif;
      font-size: clamp(1.4rem, 4vw, 2.8rem);
      font-weight: 900;
      text-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }

    .time-label {
      margin-top: 0.5rem;
      color: white;
      font-family: 'TakisVeneer', sans-serif;
      font-size: clamp(0.6rem, 1.5vw, 0.9rem);
      letter-spacing: 1px;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }

    .timer-separator {
      color: white;
      font-family: 'TakisVeneer', sans-serif;
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: 900;
      margin-bottom: 1.8rem; /* Align with smaller boxes */
      text-shadow: 0 0 10px rgba(0,0,0,0.5);
    }

    .close-btn {
      position: absolute;
      top: -15px;
      right: -15px;
      width: 40px;
      height: 40px;
      background: #F2E74B;
      border: none;
      border-radius: 50%;
      color: #5d1f87;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 10px 20px rgba(0,0,0,0.5);
      z-index: 100;
      transition: 0.2s;
    }

    .close-btn:hover {
      transform: scale(1.1) rotate(90deg);
    }

    @media (max-width: 600px) {
      .countdown-timer-overlay { bottom: 5%; gap: 0.3rem; }
      .time-box { border-radius: 0.8rem; }
      .timer-separator { margin-bottom: 1.8rem; }
    }
  `]
})
export class CountdownModalComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter<void>();

  days = signal('00');
  hours = signal('00');
  minutes = signal('00');
  seconds = signal('00');

  private timerId: any;
  private targetDate = new Date('2026-05-01T00:00:00').getTime();

  ngOnInit() {
    this.updateTimer();
    this.timerId = setInterval(() => this.updateTimer(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  private updateTimer() {
    const now = new Date().getTime();
    const distance = this.targetDate - now;

    if (distance < 0) {
      this.days.set('00');
      this.hours.set('00');
      this.minutes.set('00');
      this.seconds.set('00');
      return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    this.days.set(this.pad(d));
    this.hours.set(this.pad(h));
    this.minutes.set(this.pad(m));
    this.seconds.set(this.pad(s));
  }

  private pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  close() {
    this.onClose.emit();
  }
}
