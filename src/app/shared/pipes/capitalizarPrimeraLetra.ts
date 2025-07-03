import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizarPrimeraLetra',
  standalone: true,
})
export class CapitalizarPrimeraLetraPipe implements PipeTransform {
  transform(value: string | unknown): string {
    if (typeof value !== 'string' || !value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
