// src/app/components/login/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  // (click) event #3 — login form submit
  onLogin(): void {
    this.errorMessage = '';
    if (!this.username || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }
    this.loading = true;
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/locations']),
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.error || err.error?.detail || 'Login failed. Please try again.';
      },
    });
  }
}
