import { Pipe, PipeTransform } from '@angular/core';
import { NgStyleInput } from '../core/table/cell.interface';
import { AbstractControl, FormControl, FormControlStatus } from '@angular/forms';

@Pipe({
    name: 'resolveNgStyle',
    standalone: true,
})
export class ResolveNgStylePipe implements PipeTransform {
    transform(style?: NgStyleInput, value?: any, status?: FormControlStatus, row?: any, rowStatus?: FormControlStatus): Record<string, any> {
        if (!style) return {};
        return typeof style === 'function' ? style(value, status, row, rowStatus) : style;
    }
}
