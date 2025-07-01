import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule,FormArray } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Usuario } from '../../shared/models/usuario.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  imagenPerfilFile?: File;
  imagenSecundariaFile?: File;
  cargando = false;
  errorMsg = '';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-Z]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      rol: ['paciente', Validators.required],
      obra_social: [''],               
      especialidades: this.fb.array([])
    });

  }

onFileSelected(event: Event, esSecundaria: boolean = false) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    if (esSecundaria) {
      this.imagenSecundariaFile = target.files[0];
    } else {
      this.imagenPerfilFile = target.files[0];
    }
  }
}

async registrar() {
  console.log('Intentando registrar...');
  this.submitted = true;
  this.errorMsg = '';

  const rol = this.form.value.rol;
  const esPaciente = rol === 'paciente';

  // Validación condicional
  if (this.form.invalid || !this.imagenPerfilFile || (esPaciente && !this.imagenSecundariaFile)) {
    this.errorMsg = 'Completa todos los campos y subí las imágenes necesarias.';
    return;
  }

  // Obtener especialidades si es especialista
  const especialidadesSeleccionadas = this.especialidades.controls.map(c => c.value).filter((v: string) => v && v.trim().length > 0);

  const usuario: Usuario = {
    id: '',
    email: this.form.value.email,
    nombre: this.form.value.nombre,
    apellido: this.form.value.apellido,
    dni: this.form.value.dni,
    rol,
    verificado: esPaciente,
    fecha_nacimiento: this.form.value.fecha_nacimiento,
    obra_social: esPaciente ? this.form.value.obra_social || null : null
  };

  this.cargando = true;

  try {
    await this.authService.registrarse(
      usuario,
      this.form.value.password,
      this.imagenPerfilFile!,
      this.imagenSecundariaFile,
      especialidadesSeleccionadas
    );
    alert('Registro exitoso!');
    this.router.navigate(['/login']);
  } catch (error: any) {
    this.errorMsg = error.message || 'Error al registrarse.';
  } finally {
    this.cargando = false;
  }
}


  get especialidades() {
    return this.form.get('especialidades') as FormArray;
  }

  agregarEspecialidad() 
  {
  this.especialidades.push(this.fb.control('', Validators.required));
  }

  get rolSeleccionado(): string 
  {
  return this.form.get('rol')?.value;
  }



    get f() {
    return this.form.controls;
  }
}
