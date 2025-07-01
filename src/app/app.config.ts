import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

import { NavbarComponent } from './shared/components/navbar/navbar.component';

export const appConfig = {
  standalone: true,
  imports: [
    BrowserAnimationsModule,
    NavbarComponent, 
    provideRouter(routes),
    
  ],
  providers: []
};
