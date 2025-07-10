import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  OnInit
} from '@angular/core';

@Directive({
  selector: '[appAlternarImagen]',
  standalone: true
})
export class AlternarImagenDirective implements OnInit {
  @Input('appAlternarImagen') images?: (string | undefined | null)[] = [];

  private validImages: string[] = [];
  private currentIndex = 0;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  async ngOnInit(): Promise<void> {
    const urls = (this.images || []).filter((img): img is string => !!img);

    // Validar si las imágenes existen realmente (usando carga de <img>)
    for (const url of urls) {
      const isValid = await this.checkImageExists(url);
      if (isValid) this.validImages.push(url);
    }

    // Mostrar solo si hay al menos una válida
    if (this.validImages.length > 0) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.validImages[0]);
    }
  }

  @HostListener('click') onClick(): void {
    if (this.validImages.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.validImages.length;
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.validImages[this.currentIndex]);
  }

  private checkImageExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}
