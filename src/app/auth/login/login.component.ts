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
  usuariosRapidos = [
    {
      email: 'hectorsantiagoesquivel@gmail.com',
      rol: 'Admin',
      img: 'https://hcghaysrtiwxpmbmgeld.supabase.co/storage/v1/object/public/imagenes/usuarios/06b827e5-f25d-4c5c-9c5f-d50bfbafb320-Hector/imagen1.png'
    },
    {
      email: 'overjoyed.viper3390@maildrop.cc',
      rol: 'Especialista 1',
      img: 'https://hcghaysrtiwxpmbmgeld.supabase.co/storage/v1/object/public/imagenes/usuarios/98201060-e1fd-43ec-8c23-b95d67492f0b-Luis/imagen1.png'
    },
    {
      email: 'hellish.tiger3551@maildrop.cc',
      rol: 'Especialista 2',
      img: 'https://hcghaysrtiwxpmbmgeld.supabase.co/storage/v1/object/public/imagenes/usuarios/e503ece3-b5fb-42ed-a56d-970c4127feda-Romulo/imagen1.png'
    },
    {
      email: 'jagged.shrew9020@maildrop.cc',
      rol: 'Paciente 1',
      img: 'https://hcghaysrtiwxpmbmgeld.supabase.co/storage/v1/object/public/imagenes/usuarios/18d10d7a-d081-4e88-a1d7-0eb958989eca-Dario/imagen1.png'
    },
    {
      email: 'strange.sparrow9798@maildrop.cc',
      rol: 'Paciente 2',
      img: 'https://hcghaysrtiwxpmbmgeld.supabase.co/storage/v1/object/public/imagenes/usuarios/ffb47c9e-529f-4f71-932e-bf21d793e4bf-Homero/imagen1.png'
    },
    {
      email: 'salty.marten4821@maildrop.cc',
      rol: 'Paciente 3',
      img: 'https://hcghaysrtiwxpmbmgeld.supabase.co/storage/v1/object/public/imagenes/usuarios/c0d98dad-bd65-4d86-a837-87c00fb5d54a-Gustavo/imagen1.png'
    }
  ];


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



  autocompletar(user: { email: string }) {
    this.email = user.email;
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
