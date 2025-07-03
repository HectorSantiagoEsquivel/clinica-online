import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('staggerFade', [
      transition(':enter', [
        query('.fade-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string | null = null;
  cargando: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

  async login() {
    this.cargando = true;
    this.error = null;
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigate(['/home']);
    } catch (err: any) {
      this.error = this.traducirError(err.message);
    }
    this.cargando = false;
  }

  autocompletar(tipo: 'paciente' | 'especialista' | 'admin') {
    switch (tipo) {
      case 'paciente':
        this.email = 'fresh.pelican9473@maildrop.cc';
        break;
      case 'especialista':
        this.email = 'meaty.eel8794@maildrop.cc';
        break;
      case 'admin':
        this.email = 'hectorsantiagoesquivel@gmail.com';
        break;
    }
    this.password = 'contraseña';
  }

  private traducirError(mensaje: string): string {
    switch (mensaje) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas. Verificá tu email y contraseña.';
      case 'Email not confirmed':
        return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
      case 'User not found':
        return 'Usuario no encontrado.';
      case 'Network error':
        return 'Error de red. Verificá tu conexión a internet.';
      default:
        return mensaje || 'Ocurrió un error al iniciar sesión.';
    }
  }
}
