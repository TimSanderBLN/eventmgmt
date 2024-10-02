import { Routes } from '@angular/router';
import { StartseiteComponent } from './startseite/startseite.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    { path: '', component: StartseiteComponent },   // Leere Route für die Startseite
    { path: 'login', component: LoginComponent },
    { path: '**', redirectTo: '' },                // Wildcard-Route für ungültige Routen
];
