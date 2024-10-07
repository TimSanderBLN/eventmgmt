import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = false;
  private username = '';

  login(username: string) {
    this.isLoggedIn = true;
    this.username = username;
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', username);
  }

  logout() {
    this.isLoggedIn = false;
    this.username = '';
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
  }

  isAuthenticated(): boolean {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  }

  getUsername(): string {
    return sessionStorage.getItem('username') || '';
  }
}