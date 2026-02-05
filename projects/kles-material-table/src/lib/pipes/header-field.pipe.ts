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
    ): (IKlesFieldConfig & { filterable?: boolean; sortable?: boolean; sortArrowPosition?: SortHeaderArrowPosition }) | null {
        if (!col) return null;
        return {
            name: col.columnDef,
            filterable: col.filterable,
            sortable: col.sortable,
            sortArrowPosition: col.sortArrowPosition,
            ...col.headerCell,
        };
    }
}
