import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router, private authService: AuthService, private msalService: MsalService) {}

  async initializeMsal() {
    await this.msalService.instance.initialize();
    console.log('MSAL initialized');
  }

  ngOnInit() {
      this.initializeMsal();
  }

  // Normaler Login
  login() {
    if (this.username === 'tim.sander' && this.password === '123') {
      this.authService.login(this.username);  // Logge den Benutzer ein
      this.router.navigate(['/event-uebersicht']);  // Weiterleiten nach erfolgreichem Login
    } else {
      alert('Ungültiger Benutzername oder Passwort');
    }
  }

  // Microsoft Entra ID Login
  loginWithMicrosoft() {
    this.msalService.loginPopup().subscribe({
      next: (response: AuthenticationResult) => {
        this.msalService.instance.setActiveAccount(response.account);
        const username = response.account?.username;

        if (username) {
          this.authService.login(username);  // Setze den Benutzer als eingeloggt
          this.authService.checkAndAddNewUser(username);
          this.router.navigate(['/event-uebersicht']);  // Weiterleitung
        }
      },
      error: (error) => {
        console.error('Login Fehler:', error);
        alert('Login fehlgeschlagen.');
      }
    });
  }
}
