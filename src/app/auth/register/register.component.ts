import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { Usuario } from '../../shared/models/usuario.model';
import { RecaptchaModule } from 'ng-recaptcha';
import { SpinnerDirective } from '../../shared/directives/spinner.directive';
import { CapitalizarPrimeraLetraPipe } from '../../shared/pipes/capitalizarPrimeraLetra';

import { EspecialidadService } from '../../shared/services/especialidad.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CapitalizarPrimeraLetraPipe,
    CommonModule,
    RecaptchaModule,
    SpinnerDirective
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  rolSeleccionado: 'paciente' | 'especialista' |null = null;
  imagenPerfilFile?: File;
  imagenSecundariaFile?: File;
  cargando = false;
  errorMsg = '';
  submitted = false;

  captchaResuelto = false;
  captchaToken: string | null = null;

  especialidadesDisponibles: { id: string; nombre: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private especialidadService: EspecialidadService
  ) {}

  async ngOnInit() {
    this.crearFormulario();
    this.configurarCambioRol();
    await this.cargarEspecialidades();
    this.inicializarRol();
  }

  private crearFormulario(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
      dni: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      rol: [null, Validators.required],
      obra_social: [''],
      especialidades: this.fb.array([]),
      nuevaEspecialidad: ['']
    }, { validators: this.passwordsIguales });
  }

  private passwordsIguales(formGroup: FormGroup): ValidationErrors | null {
    const pass = formGroup.get('password')?.value;
    const confirm = formGroup.get('confirmarPassword')?.value;
    return pass === confirm ? null : { passwordsNoCoinciden: true };
  }

  private configurarCambioRol(): void {
    this.form.get('rol')?.valueChanges.subscribe(role => {
      this.rolSeleccionado = role;
      if (role === 'paciente') {
        this.form.get('obra_social')?.enable();
        this.resetEspecialidades();
      } else {
        this.form.get('obra_social')?.disable();
        this.resetEspecialidades();
      }
    });
  }

  private inicializarRol(): void {
    const role: 'paciente' | 'especialista' = this.form.get('rol')?.value;
    this.rolSeleccionado = role;
    if (role === 'paciente') {
      this.form.get('obra_social')?.enable();
    } else {
      this.form.get('obra_social')?.disable();
    }
  }

  private resetEspecialidades(): void {
    this.form.setControl('especialidades', this.fb.array([]));
  }

  private async cargarEspecialidades(): Promise<void> {
    try {
      this.especialidadesDisponibles = await this.especialidadService.getEspecialidades();
    } catch (e) {
      console.error('Error al cargar especialidades', e);
    }
  }

  private validarAntesDeEnviar(): boolean {
    const esPaciente = this.rolSeleccionado === 'paciente';
    this.submitted = true;
    if (
      this.form.invalid ||
      !this.imagenPerfilFile ||
      (esPaciente && !this.imagenSecundariaFile) ||
      !this.captchaResuelto
    ) {
      this.errorMsg = 'Completa todos los campos requeridos y resuelve el captcha.';
      return true;
    }
    return false;
  }

  private extraerEspecialidades(): string[] {
    return (this.form.get('especialidades') as FormArray).controls
      .map(c => c.value)
      .filter((v: string) => v?.trim().length > 0);
  }

  private armarUsuario(): Usuario {
    const { nombre, apellido, email, dni, fecha_nacimiento, obra_social } = this.form.value;
    return {
      id: '',
      nombre,
      apellido,
      email,
      dni,
      rol: this.rolSeleccionado,
      verificado: this.rolSeleccionado === 'paciente',
      fecha_nacimiento,
      obra_social: this.rolSeleccionado === 'paciente' ? obra_social || null : null
    };
  }

  private async enviarRegistro(usuario: Usuario, especialidades: string[]): Promise<void> {
    try {
      await this.authService.registrarse(
        usuario,
        this.form.value.password,
        this.imagenPerfilFile!,
        this.imagenSecundariaFile,
        especialidades
      );

      await Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: 'Por favor verifique su mail.',
        confirmButtonText: 'Ir al login',
      });

      this.router.navigate(['/login']);
    } catch (e: any) {
      this.errorMsg = e.message || 'Error al registrarse.';
    } finally {
      this.cargando = false;
    }
  }

  async registrar(): Promise<void> {
    this.cargando = true;
    if (this.validarAntesDeEnviar()) {
      this.cargando = false;
      return;
    }
    const especialidades = this.extraerEspecialidades();
    const usuario = this.armarUsuario();
    await this.enviarRegistro(usuario, especialidades);
  }

  onFileSelected(event: Event, esSecundaria = false): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    esSecundaria ? (this.imagenSecundariaFile = file) : (this.imagenPerfilFile = file);
  }

  onCaptchaResolved(token: string | null): void {
    this.captchaToken = token;
    this.captchaResuelto = !!token;
  }

  agregarEspecialidadDesdeCombo(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const valor = select.value;
    const formArray = this.form.get('especialidades') as FormArray;
    if (valor && !formArray.controls.some(c => c.value === valor)) {
      formArray.push(this.fb.control(valor, Validators.required));
    }
    select.selectedIndex = 0;
  }

  agregarEspecialidadNueva(): void {
    const control = this.form.get('nuevaEspecialidad');
    const nombre = control?.value?.trim();
    if (!nombre) return;
    const formArray = this.form.get('especialidades') as FormArray;
    if (!formArray.controls.some(c => c.value?.toLowerCase() === nombre.toLowerCase())) {
      formArray.push(this.fb.control(nombre, Validators.required));
    }
    control?.reset();
  }

  get especialidades(): FormArray {
    return this.form.get('especialidades') as FormArray;
  }

  get f() {
    return this.form.controls;
  }
}
