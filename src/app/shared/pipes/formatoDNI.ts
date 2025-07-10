import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'formatoDni', standalone: true })
export class FormatoDniPipe implements PipeTransform {
  transform(value: number | string | undefined): string {
    if (!value) return '';
    const str = value.toString();
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}