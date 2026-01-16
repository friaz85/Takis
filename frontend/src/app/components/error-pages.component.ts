import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="error-page">
      <div class="content">
        <h1>404</h1>
        <h2>TE EXTRAVIASTE EN LO INTENSO</h2>
        <p>Esta página no existe o no tiene suficiente Takis.</p>
        <a routerLink="/" class="takis-btn">VOLVER AL INICIO</a>
      </div>
    </div>
  `,
    styles: [`
    .error-page { height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; text-align: center; }
    h1 { font-size: 8rem; color: #F2E74B; font-weight: 900; margin: 0; text-shadow: 5px 5px 0 #6C1DDA; }
    h2 { color: white; margin-bottom: 2rem; font-weight: 900; }
    p { color: #aaa; margin-bottom: 3rem; }
    .takis-btn { padding: 1.2rem 2rem; background: #F2E74B; color: #1A0B2E; text-decoration: none; border-radius: 1rem; font-weight: 900; }
  `]
})
export class NotFoundComponent { }

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="error-page">
      <div class="content">
        <h1>403</h1>
        <h2>ACCESO NO PERMITIDO</h2>
        <p>No tienes los permisos necesarios para estar aquí.</p>
        <a routerLink="/" class="takis-btn">VOLVER A SALVO</a>
      </div>
    </div>
  `,
    styles: [`
    .error-page { height: 100vh; background: #1A0B2E; display: flex; align-items: center; justify-content: center; text-align: center; }
    h1 { font-size: 8rem; color: #ff4444; font-weight: 900; margin: 0; }
    h2 { color: white; margin-bottom: 2rem; font-weight: 900; }
    p { color: #aaa; margin-bottom: 3rem; }
    .takis-btn { padding: 1.2rem 2rem; background: #F2E74B; color: #1A0B2E; text-decoration: none; border-radius: 1rem; font-weight: 900; }
  `]
})
export class UnauthorizedComponent { }
