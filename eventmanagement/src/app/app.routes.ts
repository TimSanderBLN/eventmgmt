import { Routes } from '@angular/router';
import { StartseiteComponent } from './startseite/startseite.component';
import { LoginComponent } from './login/login.component';
import { EventUebersichtComponent } from './event-uebersicht/event-uebersicht.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    { path: '', component: StartseiteComponent },   // Leere Route für die Startseite
    { path: 'login', component: LoginComponent },
    { path: 'event-uebersicht', component: EventUebersichtComponent, canActivate: [authGuard] },
    { path: '**', redirectTo: '' },                // Wildcard-Route für ungültige Routen
];
