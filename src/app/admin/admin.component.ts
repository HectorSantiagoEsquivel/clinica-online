import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from './admin.service';
import { Usuario } from '../shared/models/usuario.model';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  usuarios: Usuario[] = [];
  crearForm!: FormGroup;
  imagenPerfilFile?: File;
  cargando = false;
  errorMsg = '';
  successMsg = '';
  tabActiva: 'lista' | 'crear' = 'lista';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.crearForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      rol: ['paciente', Validators.required],
      obra_social: [''],
      especialidades: this.fb.array([])
    });

    this.cargarUsuarios();
  }

  async cargarUsuarios() {
    try {
      this.usuarios = await this.adminService.getUsuarios();
    } catch (error: any) {
      this.errorMsg = error.message;
    }
  }

  async cambiarVerificacion(usuario: Usuario) {
    try {
      await this.adminService.cambiarVerificacionEspecialista(usuario.id, !usuario.verificado);
      usuario.verificado = !usuario.verificado;
    } catch (error: any) {
      this.errorMsg = error.message;
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      this.imagenPerfilFile = target.files[0];
    }
  }

  get especialidades() {
    return this.crearForm.get('especialidades') as FormArray;
  }

  agregarEspecialidad() {
    this.especialidades.push(this.fb.control('', Validators.required));
  }

  async crearUsuario() {
    this.errorMsg = '';
    this.successMsg = '';
    this.cargando = true;

    if (this.crearForm.invalid || !this.imagenPerfilFile) {
      this.errorMsg = 'Todos los campos son obligatorios, incluyendo la imagen.';
      this.cargando = false;
      return;
    }

    const form = this.crearForm.value;
    const rol = form.rol;
    const esEspecialista = rol === 'especialista';
    const esPaciente = rol === 'paciente';

    const especialidadesSeleccionadas = this.especialidades.controls
      .map(ctrl => ctrl.value)
      .filter((v: string) => v?.trim().length > 0);

    const nuevoUsuario: Usuario = {
      id: '',
      email: form.email,
      nombre: form.nombre,
      apellido: form.apellido,
      dni: form.dni,
      rol,
      verificado: esEspecialista ? false : true,
      fecha_nacimiento: form.fecha_nacimiento,
      obra_social: esPaciente ? form.obra_social || undefined : undefined
    };

    try {
      await this.authService.registrarse(
        nuevoUsuario,
        form.password,
        this.imagenPerfilFile!,
        undefined,
        especialidadesSeleccionadas
      );

      this.successMsg = 'Usuario creado exitosamente.';
      this.crearForm.reset({ rol: 'paciente' });
      this.especialidades.clear();
      this.imagenPerfilFile = undefined;
      this.cargarUsuarios();
    } catch (error: any) {
      this.errorMsg = error.message || 'Error al crear el usuario.';
    } finally {
      this.cargando = false;
    }
  }

  verHistoria(usuario: Usuario) {
  this.router.navigate(['/historia-clinica', usuario.id]);
  }

}
