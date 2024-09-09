import { Routes } from '@angular/router';
import { StartseiteComponent } from './startseite/startseite.component';

export const routes: Routes = [
    { path: '', component: StartseiteComponent },   // Leere Route für die Startseite
    { path: '**', redirectTo: '' },                // Wildcard-Route für ungültige Routen
];
