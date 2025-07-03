import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Usuario } from '../../shared/models/usuario.model';
import { RecaptchaModule } from 'ng-recaptcha';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import { CapitalizarPrimeraLetraPipe } from '../../shared/pipes/capitalizarPrimeraLetra';
import { CapitalizarInputDirective } from '../../shared/directives/capitalizar-input.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CapitalizarPrimeraLetraPipe,
    CommonModule,
    RecaptchaModule,
    SpinnerDirective,
    CapitalizarInputDirective // ✅ Acá estaba faltando
  ],
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

  captchaResuelto: boolean = false;
  captchaToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
      dni: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      rol: ['paciente', Validators.required],
      obra_social: [''],  // solo paciente
      especialidades: this.fb.array([]),  // solo especialista
    }, {
      validators: this.passwordsIguales
    });

    this.form.get('rol')?.valueChanges.subscribe(rol => {
      if (rol === 'paciente') {
        this.form.get('obra_social')?.enable();
        this.form.setControl('especialidades', this.fb.array([]));
      } else if (rol === 'especialista') {
        this.form.get('obra_social')?.disable();
        if (!this.form.get('especialidades')) {
          this.form.setControl('especialidades', this.fb.array([]));
        }
        this.agregarEspecialidad();
      }
    });

    this.form.get('rol')?.updateValueAndValidity();
  }

  passwordsIguales(formGroup: FormGroup) {
    const pass = formGroup.get('password')?.value;
    const confirm = formGroup.get('confirmarPassword')?.value;
    return pass === confirm ? null : { passwordsNoCoinciden: true };
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

  onCaptchaResolved(token: string | null) {
    this.captchaToken = token;
    this.captchaResuelto = !!token;
    console.log('Captcha resuelto:', token);
  }

  async registrar() {
    this.cargando = true;
    this.submitted = true;
    this.errorMsg = '';

    const rol = this.form.value.rol;
    const esPaciente = rol === 'paciente';

    if (this.form.invalid || !this.imagenPerfilFile || (esPaciente && !this.imagenSecundariaFile) || !this.captchaResuelto) {
      this.errorMsg = 'Completa todos los campos requeridos y resuelve el captcha.';
      this.cargando = false;
      return;
    }

    const especialidadesSeleccionadas = this.especialidades.controls
      .map(c => c.value)
      .filter((v: string) => v && v.trim().length > 0);

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

  agregarEspecialidad() {
    this.especialidades.push(this.fb.control('', Validators.required));
  }

  get rolSeleccionado(): string {
    return this.form.get('rol')?.value;
  }

  get f() {
    return this.form.controls;
  }
}
