// src/app/shared/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';        // <-- ¡agregado!
import { AuthService } from '../../../auth/auth.service';
import { Usuario } from '../../models/usuario.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,                                    // <-- ¡agregado!
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  usuario?: Usuario | null;
  cargando = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.session$.subscribe(async session => {
      if (session?.user) {
        try {
          this.usuario = await this.authService.getUserProfile();
        } catch {
          this.usuario = null;
        }
      } else {
        this.usuario = null;
      }
      this.cargando = false;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  get isAdmin(): boolean {
    return this.usuario?.rol === 'admin';
  }
  get isEspecialista(): boolean {
    return this.usuario?.rol === 'especialista';
  }
  get isPaciente(): boolean {
    return this.usuario?.rol === 'paciente';
  }
}
