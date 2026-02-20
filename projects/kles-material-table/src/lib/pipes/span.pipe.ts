import { Pipe, PipeTransform } from '@angular/core';
import { Span } from '../enums/span.enum';

@Pipe({
    name: 'spanPipe',
    standalone: true,
})
export class SpanPipe implements PipeTransform {
    transform(span: number | Span, maxSize: number): number {
        if (span === Span.MAX) {
            return maxSize;
        }
        return span;
    }
}
