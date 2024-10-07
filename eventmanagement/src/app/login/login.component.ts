import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

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

  constructor(private router: Router, private authService: AuthService) {}

  login() {
    if (this.username === 'tim.sander' && this.password === '123') {
      this.authService.login(this.username);  // Logge den Benutzer ein
      this.router.navigate(['/event-uebersicht']);  // Weiterleiten nach erfolgreichem Login
    } else {
      alert('Ungültiger Benutzername oder Passwort');
    }
  }
}
