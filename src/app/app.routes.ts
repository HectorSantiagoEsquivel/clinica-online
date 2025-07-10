import { Routes } from '@angular/router';
import { authGuard } from './shared/guard/auth.guard';
import { VerificadoGuard } from './shared/guard/verificado.guard';
import { RoleGuard } from './shared/guard/role.guard';
import { noAuthGuard } from './shared/guard/noauth.guard';
import { NoVerificadoGuard } from './shared/guard/no-verificado.guard';

// Componentes
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
import { PacientesAtendidosComponent } from './shared/components/pacientes-atendidos/pacientes-atendidos.component';
import { HistoriaClinicaPacienteComponent } from './shared/components/historia-clinica-paciente/historia-clinica-paciente.component';
import { AdminReportesComponent } from './admin/admin-reportes/admin-reportes.component';
import { LandingComponent } from './shared/components/landing/landing.component';

export const routes: Routes = [

  {
    path: '',
    component: LandingComponent,
    data: { animation: 'home' }
  },
  {
    path: 'home',
    component: LandingComponent,
    data: { animation: 'home' }
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard],
    data: { animation: 'login' }
  },
  {
    path: 'registro',
    component: RegisterComponent,
    canActivate: [noAuthGuard],
    data: { animation: 'registro' }
  },
  {
    path: 'esperando-verificacion',
    component: EsperandoVerificacionComponent,
    canActivate: [authGuard, NoVerificadoGuard],
    data: { animation: 'esperando-verificacion' } 
  },
  {
    path: 'mi-perfil',
    component: MiPerfilComponent,
    canActivate: [authGuard, VerificadoGuard],
    data: { animation: 'mi-perfil' } 
  },
  {
    path: 'administracion',
    component: AdminComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin'], animation: 'administracion' } 
  },
  {
    path: 'mis-turnos-especialista',
    component: MisTurnosEspecialistaComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['especialista'], animation: 'mis-turnos-especialista' }
  },
  {
    path: 'mis-turnos-paciente',
    component: MisTurnosPacienteComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['paciente'], animation: 'mis-turnos-paciente' }
  },
  {
    path: 'solicitar-turnos',
    component: SolicitarTurnoComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin', 'paciente'], animation: 'solicitar-turnos' } 
  },
  {
    path: 'cargar-historia/:turnoId/:pacienteId',
    component: CargarHistoriaClinicaComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['especialista'], animation: 'cargar-historia' } 
  },
  {
    path: 'historia-clinica/:pacienteId',
    component: HistoriaClinicaPacienteComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['especialista', 'admin'], animation: 'historia-clinica' }
  },
  {
    path: 'turnos-admin',
    component: TurnosAdminComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin'], animation: 'turnos-admin' } 
  },
  {
    path: 'estadisticas',
    component: AdminReportesComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['admin'], animation: 'estadisticas' } 
  },
  {
    path: 'pacientes-atendidos',
    component: PacientesAtendidosComponent,
    canActivate: [authGuard, VerificadoGuard, RoleGuard],
    data: { roles: ['especialista'], animation: 'pacientes-atendidos' }
  },
  {
    path: '**',
    redirectTo: '',
    data: { animation: 'login' }
  }
];
