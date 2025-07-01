import { Directive, Input, Renderer2, ElementRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appSpinner]',
  standalone: true,
})
export class SpinnerDirective implements OnInit, OnChanges {
  @Input('appSpinner') isLoading: boolean = false;
  private spinnerElement!: HTMLElement;
  private readonly spinnerImageUrl = '/assets/logoClinica.png';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.createSpinner();
    this.toggleSpinner(this.isLoading);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isLoading']) {
      this.toggleSpinner(changes['isLoading'].currentValue);
    }
  }

private createSpinner() {
  this.spinnerElement = this.renderer.createElement('div');
  this.renderer.setStyle(this.spinnerElement, 'position', 'fixed'); // Cambiado a fixed
  this.renderer.setStyle(this.spinnerElement, 'top', '0');
  this.renderer.setStyle(this.spinnerElement, 'left', '0');
  this.renderer.setStyle(this.spinnerElement, 'width', '100%');
  this.renderer.setStyle(this.spinnerElement, 'height', '100%');
  this.renderer.setStyle(this.spinnerElement, 'background-color', 'rgba(35, 35, 35, 0.6)');
  this.renderer.setStyle(this.spinnerElement, 'z-index', '10');
  this.renderer.setStyle(this.spinnerElement, 'display', 'none');
  this.renderer.setStyle(this.spinnerElement, 'justify-content', 'center');
  this.renderer.setStyle(this.spinnerElement, 'align-items', 'center');

  const spinnerIcon = this.renderer.createElement('img');
  this.renderer.setAttribute(spinnerIcon, 'src', this.spinnerImageUrl);
  this.renderer.setStyle(spinnerIcon, 'width', '300px');
  this.renderer.setStyle(spinnerIcon, 'animation', 'spin 2s linear infinite'); // 👈 Línea nueva

  this.renderer.appendChild(this.spinnerElement, spinnerIcon);
  this.renderer.appendChild(this.el.nativeElement, this.spinnerElement);
}

  private toggleSpinner(show: boolean) {
    if (show) {
      this.renderer.setStyle(this.spinnerElement, 'display', 'flex');
    } else {
      this.renderer.setStyle(this.spinnerElement, 'display', 'none');
    }
  }
}
