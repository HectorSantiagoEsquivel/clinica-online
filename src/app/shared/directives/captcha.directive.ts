import {
  Directive,
  ElementRef,
  Renderer2,
  Output,
  EventEmitter,
  Input,
  OnInit
} from '@angular/core';

@Directive({
  selector: '[appCaptcha]'
})
export class CaptchaDirective implements OnInit {
  @Output() captchaValido = new EventEmitter<boolean>();
  @Input() deshabilitado: boolean = false;

  private resultadoEsperado: number = 0;
  private canvas!: HTMLCanvasElement;
  private input!: HTMLInputElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    if (this.deshabilitado) {
      this.captchaValido.emit(true);
      return;
    }

    this.input = this.el.nativeElement;

    // Crear contenedor para el captcha
    const wrapper = this.renderer.createElement('div');
    this.renderer.setStyle(wrapper, 'marginTop', '1rem');
    this.renderer.setStyle(wrapper, 'marginBottom', '1rem');
    this.renderer.setStyle(wrapper, 'display', 'flex');
    this.renderer.setStyle(wrapper, 'flexDirection', 'column');
    this.renderer.setStyle(wrapper, 'gap', '0.5rem');

    // Crear el canvas
    this.canvas = this.renderer.createElement('canvas');
    this.canvas.width = 500;
    this.canvas.height = 40;

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#333';
    }

    this.generarCaptcha();

    // Mover input dentro del wrapper
    const parent = this.renderer.parentNode(this.input);
    this.renderer.removeChild(parent, this.input);

    this.renderer.appendChild(wrapper, this.canvas);
    this.renderer.appendChild(wrapper, this.input);
    this.renderer.appendChild(parent, wrapper);

    // Validar al escribir
    this.renderer.listen(this.input, 'input', () => {
      const valor = parseInt(this.input.value);
      this.captchaValido.emit(valor === this.resultadoEsperado);
    });
  }

  private generarCaptcha() {
    const a = Math.floor(Math.random() * 10);
    const b = Math.floor(Math.random() * 10);
    this.resultadoEsperado = a + b;

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillText(`¿Cuánto es ${a} + ${b}?`, 10, 25);
    }
  }
}
