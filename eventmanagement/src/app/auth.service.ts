import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private msalService: MsalService, private http: HttpClient) {}

  checkAndAddNewUser(email: string) {
    console.log('wird ausgeführt');
    const url = 'http://127.0.0.1:8000'; // Endpunkt für das Backend
    const userCheckUrl = `${url}/get-user?email=${email}`; // URL zum Überprüfen des Benutzers in der Datenbank

    // Überprüfen, ob der Benutzer bereits existiert
    this.http.get(userCheckUrl).subscribe({
      next: () => {
        console.log('Benutzer existiert bereits.');
      },
      error: (error) => {
        if (error.status === 404) {
          // Benutzer existiert nicht, also neuen Benutzer anlegen
          const nameParts = email.split('@')[0].split('.');
          const vname = this.capitalizeFirstLetter(nameParts[0]);
          const nname = this.capitalizeFirstLetter(nameParts[1]);

          const newUser = { vname: vname, nname: nname, email: email };

          // Neuen Benutzer in der Datenbank speichern
          this.http.post(`${url}/create-user`, newUser).subscribe(() => {
            console.log('Neuer Benutzer angelegt:', newUser);
          }, error => {
            console.error('Fehler beim Anlegen des Benutzers:', error);
          });
        }
      }
    });
}
    // Funktion, um den ersten Buchstaben eines Strings groß zu machen
    capitalizeFirstLetter(string: string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

  // Normaler Login (nicht Microsoft Entra ID)
  login(username: string) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', username);
  }

  // Überprüfen, ob der Benutzer authentifiziert ist (normaler Login oder Microsoft Entra ID)
  isAuthenticated(): boolean {
    // Prüft sowohl auf normalen Login als auch auf Microsoft Entra ID Login
    return sessionStorage.getItem('isLoggedIn') === 'true' || this.msalService.instance.getActiveAccount() != null;
  }

  // Benutzer ausloggen (sowohl für normalen Login als auch Microsoft Entra ID)
  logout(): void {
    // Normales Logout (lokale Session aufräumen)
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.clear();

    // Microsoft Entra ID Logout
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.msalService.logoutPopup().subscribe({
        next: () => {
          console.log('Microsoft Entra ID Logout erfolgreich');
          this.msalService.instance.setActiveAccount(null); // Active Account zurücksetzen
        },
        error: (error) => {
          console.error('Fehler beim Microsoft Entra ID Logout:', error);
        }
      });
    }
  }

  // Benutzernamen holen (normaler Login oder Microsoft Entra ID)
  getUsername(): string {
    // Falls normaler Login, hole Benutzernamen aus sessionStorage
    const sessionUsername = sessionStorage.getItem('username');
    if (sessionUsername) {
      return sessionUsername;
    }

    // Falls Microsoft Entra ID Login, hole Benutzernamen aus Microsoft Account
    const account = this.msalService.instance.getActiveAccount();
    return account ? account.username : '';
  }
}