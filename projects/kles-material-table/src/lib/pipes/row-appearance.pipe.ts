import { Pipe, PipeTransform } from '@angular/core';
import { FormControlStatus } from '@angular/forms';
import { KlesStyleMap } from '../core/table/cell.interface';
import { RowClassInput, RowClassValue, RowStyleInput } from '../core/table/config.interface';

@Pipe({
    name: 'resolveRowStyle',
    standalone: true,
})
export class ResolveRowStylePipe implements PipeTransform {
    transform(style: RowStyleInput | undefined, row: Record<string, unknown>, status: FormControlStatus, index: number): KlesStyleMap {
        if (!style) return {};
        return typeof style === 'function' ? style(row, status, index) : style;
    }
}

@Pipe({
    name: 'resolveRowClass',
    standalone: true,
})
export class ResolveRowClassPipe implements PipeTransform {
    transform(classes: RowClassInput | undefined, row: Record<string, unknown>, status: FormControlStatus, index: number): RowClassValue {
        if (!classes) return [];
        return typeof classes === 'function' ? classes(row, status, index) : classes;
    }
}
