import { Pipe, PipeTransform } from '@angular/core';
import { FormControlStatus } from '@angular/forms';
import { KlesStyleMap } from '../core/table/cell.interface';
import { RowClassInput, RowClassValue, RowStyleInput } from '../core/table/config.interface';
import { KlesRowContext } from '../core/table/row-context.interface';

@Pipe({
    name: 'resolveRowStyle',
    standalone: true,
})
export class ResolveRowStylePipe implements PipeTransform {
    transform<TSource>(
        style: RowStyleInput<TSource> | undefined,
        row: Record<string, unknown>,
        status: FormControlStatus,
        index: number,
        context: KlesRowContext<TSource>,
    ): KlesStyleMap {
        if (!style) return {};
        return typeof style === 'function' ? style(row, status, index, context) : style;
    }
}

@Pipe({
    name: 'resolveRowClass',
    standalone: true,
})
export class ResolveRowClassPipe implements PipeTransform {
    transform<TSource>(
        classes: RowClassInput<TSource> | undefined,
        row: Record<string, unknown>,
        status: FormControlStatus,
        index: number,
        context: KlesRowContext<TSource>,
    ): RowClassValue {
        if (!classes) return [];
        return typeof classes === 'function' ? classes(row, status, index, context) : classes;
    }
}
