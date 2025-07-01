import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule,ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  async ngOnInit() 
  {
    const data = await this.authService.getSesion();
    this.isLoggedIn = !!data;
  }

  async cerrarSesion() {
    this.authService.logout();
    window.location.href = '/login';
  }
}

