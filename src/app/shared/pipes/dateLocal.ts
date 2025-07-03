import { Pipe, PipeTransform,Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateLocal',
  standalone: true,
})
@Injectable({ providedIn: 'root' })
export class DateLocalPipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(
    value: Date | string | null | undefined,
    format: string = 'yyyy-MM-dd',
    timezone: string = '', 
    locale: string = 'es-AR'
  ): string | null {
    if (!value) return null;

    try {
      const fecha = typeof value === 'string' ? new Date(value) : value;
      if (isNaN(fecha.getTime())) return null;

      return this.datePipe.transform(fecha, format, timezone, locale);
    } catch (e) {
      console.error('Error formateando fecha', e);
      return null;
    }
  }
}
