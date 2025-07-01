import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-esperando-verificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './esperando-verificacion.component.html',
  styleUrls: ['./esperando-verificacion.component.scss']
})
export class EsperandoVerificacionComponent {
  rol: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.rol = this.route.snapshot.queryParamMap.get('rol');
  }
}
