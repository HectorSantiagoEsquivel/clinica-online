import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCapitalizarInput]',
  standalone: true
})
export class CapitalizarInputDirective {

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;
    const originalValue = input.value;

    const capitalizado = originalValue
      .toLowerCase()
      .replace(/\b\w/g, letra => letra.toUpperCase());

    if (originalValue !== capitalizado) {
      // Actualiza el valor visual y el del form control
      input.value = capitalizado;
      this.control.control?.setValue(capitalizado);
    }
  }
}
