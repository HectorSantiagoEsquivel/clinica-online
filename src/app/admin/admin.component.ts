import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from './admin.service';
import { Usuario } from '../shared/models/usuario.model';
import { AuthService } from '../auth/auth.service';
import { TurnosService } from '../shared/services/turno.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SpinnerDirective } from '../shared/directives/spinner.directive';
import { Turno } from '../shared/models/turno';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';



@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule,SpinnerDirective],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  usuarios: Usuario[] = [];
  crearForm!: FormGroup;
  imagenPerfilFile?: File;
  imagenSecundariaFile?: File;
  cargando = false;
  errorMsg = '';
  successMsg = '';
  tabActiva: 'lista' | 'crear' = 'lista';
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService,
    private turnoService:TurnosService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void>  {
    this.cargando=true;
    this.crearForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      apellido: ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
      dni: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      rol: ['paciente', Validators.required],
      obra_social: [{ value: '', disabled: true }],  // Inicialmente deshabilitado
      especialidades: this.fb.array([])
    }, { validators: this.passwordsIguales });

    // Suscripción al cambio de rol
    this.crearForm.get('rol')?.valueChanges.subscribe((rol) => {
      if (rol === 'paciente') {
        this.crearForm.get('obra_social')?.enable();
        this.crearForm.get('obra_social')?.setValidators(Validators.required);
        this.crearForm.get('obra_social')?.updateValueAndValidity();

        this.crearForm.setControl('especialidades', this.fb.array([]));
      } else if (rol === 'especialista') {
        this.crearForm.get('obra_social')?.setValue('');
        this.crearForm.get('obra_social')?.clearValidators();
        this.crearForm.get('obra_social')?.disable();
        this.crearForm.get('obra_social')?.updateValueAndValidity();

        this.crearForm.setControl('especialidades', this.fb.array([]));
        if (this.especialidades.length === 0) {
          this.agregarEspecialidad();
        }
      }
    });

    this.crearForm.get('rol')?.updateValueAndValidity();
    await this.cargarUsuarios();
    this.cargando=false;
  }

  passwordsIguales(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmarPassword')?.value;
    return pass === confirm ? null : { passwordsNoCoinciden: true };
  }

  get especialidades() {
    return this.crearForm.get('especialidades') as FormArray;
  }

  get f() {
    return this.crearForm.controls;
  }

  agregarEspecialidad() {
    this.especialidades.push(this.fb.control('', Validators.required));
  }

  onFileSelected(event: Event, esSecundaria: boolean = false) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      esSecundaria ? this.imagenSecundariaFile = file : this.imagenPerfilFile = file;
    }
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

  async crearUsuario() {
    this.submitted = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.cargando = true;

    const rol = this.crearForm.value.rol;
    const esPaciente = rol === 'paciente';

    if (this.crearForm.invalid || !this.imagenPerfilFile || (esPaciente && !this.imagenSecundariaFile)) {
      this.errorMsg = 'Todos los campos son obligatorios, incluyendo las imágenes.';
      this.cargando = false;
      return;
    }

    const especialidadesSeleccionadas = this.especialidades.controls
      .map(ctrl => ctrl.value)
      .filter((v: string) => v?.trim().length > 0);

    const nuevoUsuario: Usuario = {
      id: '',
      email: this.crearForm.value.email,
      nombre: this.crearForm.value.nombre,
      apellido: this.crearForm.value.apellido,
      dni: this.crearForm.value.dni,
      rol,
      verificado: rol === 'especialista' ? false : true,
      fecha_nacimiento: this.crearForm.value.fecha_nacimiento,
      obra_social: esPaciente ? this.crearForm.value.obra_social || undefined : undefined
    };

    try {
      await this.authService.registrarse(
        nuevoUsuario,
        this.crearForm.value.password,
        this.imagenPerfilFile!,
        this.imagenSecundariaFile,
        especialidadesSeleccionadas
      );
      this.successMsg = 'Usuario creado exitosamente.';
      this.crearForm.reset({ rol: 'paciente' });
      this.submitted = false;
      this.imagenPerfilFile = undefined;
      this.imagenSecundariaFile = undefined;
      this.especialidades.clear();
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
  async descargarExcel() {
      this.cargando = true;
      try {

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usuarios');


        worksheet.columns = [
          { header: 'ID', key: 'id', width: 25 },
          { header: 'Nombre', key: 'nombre', width: 20 },
          { header: 'Apellido', key: 'apellido', width: 20 },
          { header: 'DNI', key: 'dni', width: 15 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Rol', key: 'rol', width: 15 },
          { header: 'Verificado', key: 'verificado', width: 10 },
          { header: 'Obra Social', key: 'obra_social', width: 20 },
          { header: 'Fecha Registro', key: 'fecha_registro', width: 20 }
        ];


        this.usuarios.forEach(usuario => {
          worksheet.addRow({
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            dni: usuario.dni,
            email: usuario.email,
            rol: usuario.rol,
            verificado: usuario.verificado ? 'Sí' : 'No',
            obra_social: usuario.obra_social || '',
            fecha_registro: usuario.fecha_registro || ''
          });
        });


        const buffer = await workbook.xlsx.writeBuffer();
        FileSaver.saveAs(new Blob([buffer]), 'usuarios.xlsx');
      } catch (error: any) {
        this.errorMsg = 'Error al generar el Excel: ' + error.message;
      } finally {
        this.cargando = false;
      }
    }
  async descargarTurnosPaciente(usuario: Usuario) {
    this.cargando = true;
    this.errorMsg = '';
    try {
      // Convertir el observable a promesa para usar async/await
      const turnos = await firstValueFrom(
        this.turnoService.obtenerTurnosPorUsuario(usuario.id, 'pacienteId')
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Turnos');

      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Hora', key: 'hora', width: 10 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Especialista', key: 'especialista', width: 25 },
        { header: 'Especialidad', key: 'especialidad', width: 20 },
        { header: 'Calificación', key: 'calificacion', width: 15 },
        { header: 'Reseña', key: 'resena', width: 30 },
      ];

      turnos.map((t: Turno) => {
        worksheet.addRow({
          fecha: t.fecha,
          hora: t.hora,
          estado: t.estado,
          especialista: t.especialista ? `${t.especialista.nombre} ${t.especialista.apellido}` : '',
          especialidad: t.especialidad ? t.especialidad.nombre : '',
          calificacion: t.calificaAtencion ?? '',
          resena: t.resena ?? ''
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      FileSaver.saveAs(new Blob([buffer]), `turnos_${usuario.nombre}_${usuario.apellido}.xlsx`);

    } catch (error: any) {
      this.errorMsg = 'Error al descargar turnos: ' + error.message;
    } finally {
      this.cargando = false;
    }
  }

  


}
