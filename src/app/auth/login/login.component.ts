import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    this.error = null;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/home']); // Ajustar según tu app
    } catch (err: any) {
      this.error = err.message || 'Error al iniciar sesión';
    }
  }
}
