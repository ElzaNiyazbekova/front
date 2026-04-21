// src/app/components/register/register.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  password2 = '';
  isAdmin = false;
  errorMessage = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  // (click) event #4 — register submit
  onRegister(): void {
    this.errorMessage = '';

    if (!this.username || !this.email || !this.password || !this.password2) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }
    if (this.password !== this.password2) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    this.loading = true;
    this.auth.register({
      username: this.username,
      email: this.email,
      password: this.password,
      password2: this.password2,
      is_admin: this.isAdmin,
    }).subscribe({
      next: () => this.router.navigate(['/locations']),
      error: (err) => {
        this.loading = false;
        const e = err.error;
        if (typeof e === 'object') {
          const first = Object.values(e)[0];
          this.errorMessage = Array.isArray(first) ? (first as string[])[0] : String(first);
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      },
    });
  }
}
