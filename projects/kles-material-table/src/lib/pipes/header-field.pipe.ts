import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { Pipe, PipeTransform } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';
import { SortHeaderArrowPosition } from '@angular/material/sort';

@Pipe({
    name: 'headerField',
    standalone: true,
})
export class HeaderFieldPipe implements PipeTransform {
    transform(
        col: KlesColumnConfig | null | undefined,
    ): (IKlesFieldConfig) | null {
        if (!col) return null;
        return {
            name: col.columnDef,
            ...col.headerCell.field,
        };
    }
}
