import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { LoginComponent } from './login/login.component';
import { EventUebersichtComponent } from './event-uebersicht/event-uebersicht.component';
import { provideMSAL } from './msal.config';
import { MsalModule } from '@azure/msal-angular';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideAnimationsAsync(), provideHttpClient(), provideMSAL()]
};
