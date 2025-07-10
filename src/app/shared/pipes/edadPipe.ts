import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'edad',
  standalone: true,
})
export class EdadPipe implements PipeTransform {
  transform(value: string | Date): number | string {
    if (!value) return 'N/D';
    const fecha = new Date(value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
    return edad;
  }
}
