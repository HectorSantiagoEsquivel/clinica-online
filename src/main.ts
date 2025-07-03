import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import 'chart.js/auto';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // <- esto es lo importante
  ]
});
