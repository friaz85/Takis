import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-container">
      <div class="gradient-overlay"></div>
      <div class="takis-particles">
        <div *ngFor="let piece of pieces" 
             class="takis-wrapper" 
             [style.left.%]="piece.x" 
             [style.top.%]="piece.y"
             [style.transform]="'rotate(' + piece.rotation + 'deg) scale(' + piece.scale + ')'">
            <div class="takis-float" 
                 [style.animation-duration.s]="piece.duration"
                 [style.animation-delay.s]="piece.delay">
              <img src="assets/takis-piece.png" alt="Takis">
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      background: #1A0B2E;
      overflow: hidden;
    }

    .gradient-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.05) 0%, transparent 70%),
                  linear-gradient(180deg, rgba(26, 11, 46, 0.8) 0%, #1A0B2E 100%);
    }

    .takis-wrapper {
      position: absolute;
      width: 60px;
      pointer-events: none;
    }

    .takis-float {
      width: 100%;
      height: 100%;
      animation: float-around infinite ease-in-out;
      opacity: 0.4;
      filter: blur(0.5px);
    }

    .takis-float img {
      width: 100%;
      height: auto;
      filter: drop-shadow(0 0 15px rgba(108, 29, 218, 0.4));
    }

    @keyframes float-around {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      33% {
        transform: translate(30px, -50px) rotate(10deg);
      }
      66% {
        transform: translate(-20px, 20px) rotate(-5deg);
      }
    }
  `]
})
export class DynamicBackgroundComponent {
  pieces = Array.from({ length: 15 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 20 + Math.random() * 20,
    delay: -Math.random() * 20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 1
  }));
}
