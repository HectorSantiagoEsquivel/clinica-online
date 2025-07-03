import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { slideInAnimation } from './animations/route-animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    RouterOutlet
  ],
  template: `
    <div class="app-layout">
      <app-navbar></app-navbar>
      <main [@routeAnimations]="prepareRoute(outlet)" class="view-container">
        <router-outlet #outlet="outlet"></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
    }
    .view-container {
      flex: 1;
      position: relative;
      overflow: auto;
      padding: 1rem;
    }
  `],
  animations: [ slideInAnimation ]
})
export class AppComponent {
  prepareRoute(outlet: RouterOutlet) {
    return outlet.activatedRouteData?.['animation'];
  }
}
