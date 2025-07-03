import { Routes } from '@angular/router';
import { authGuard } from './shared/guard/auth.guard';
import { VerificadoGuard } from './shared/guard/verificado.guard';
import { RoleGuard } from './shared/guard/role.guard';
import { noAuthGuard } from './shared/guard/noauth.guard';
import { NoVerificadoGuard } from './shared/guard/no-verificado.guard';
// Importaciones de componentes

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminComponent } from './admin/admin.component';
import { EsperandoVerificacionComponent } from './shared/components/esperando-verificacion.component';
import { MiPerfilComponent } from './shared/components/mi-perfil.component';
import { MisTurnosEspecialistaComponent } from './turnos/mis-turnos-especialista/mis-turnos-especialista.component';
import { MisTurnosPacienteComponent } from './turnos/mis-turnos-paciente/mis-turnos-paciente.component';
import { TurnosAdminComponent } from './turnos/turnos-admin/turnos-admin.component';
import { SolicitarTurnoComponent } from './turnos/solicitar-turnos/solicitar-turnos.component';
import { CargarHistoriaClinicaComponent } from './turnos/cargar-historia-clinica/cargar-historia-clinica.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [noAuthGuard]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard]
  },
  {
    path: 'registro',
    component: RegisterComponent,
    canActivate: [noAuthGuard]
  },
  {
    path: 'esperando-verificacion',
    component: EsperandoVerificacionComponent,
    canActivate: [authGuard, NoVerificadoGuard],
  },
  {
    path: 'home',
    component: MiPerfilComponent,
    canActivate: [authGuard, VerificadoGuard],
  },
  {
    path: 'administracion',
    component: AdminComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'mis-turnos-especialista',
    component: MisTurnosEspecialistaComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['especialista'] }
  },
  {
    path: 'mis-turnos-paciente',
    component: MisTurnosPacienteComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['paciente'] }
  },
  {
    path: 'solicitar-turnos',
    component: SolicitarTurnoComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin','paciente'] }
  },
  {
    path: 'cargar-historia/:turnoId/:pacienteId',
    component: CargarHistoriaClinicaComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['especialista'] }
  },
  {
    path: 'turnos-admin',
    component: TurnosAdminComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
