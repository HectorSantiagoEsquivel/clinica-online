import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appAlternarImagen]',
  standalone: true,
})
export class AlternarImagenDirective {
  @Input('appAlternarImagen') images?: (string | undefined)[] = [];
  private currentIndex = 0;

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('click') onClick(): void {
    const validImages = this.images?.filter((image): image is string => !!image);
    if (validImages && validImages.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % validImages.length;
      this.el.nativeElement.src = validImages[this.currentIndex];
    }
  }
}
