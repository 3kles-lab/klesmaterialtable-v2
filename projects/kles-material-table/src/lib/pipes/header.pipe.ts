import { Pipe, PipeTransform } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';
import { SortHeaderArrowPosition } from '@angular/material/sort';
import { IKlesHeaderFieldConfig } from '../core/table/cell.interface';

@Pipe({
    name: 'header',
    standalone: true,
})
export class HeaderPipe implements PipeTransform {
    transform(
        col: KlesColumnConfig | null | undefined,
    ):
        | (IKlesHeaderFieldConfig & { columnDef: string; filterable?: boolean; sortable?: boolean; sortArrowPosition?: SortHeaderArrowPosition })
        | null {
        if (!col) return null;
        return {
            columnDef: col.columnDef,
            filterable: col.filterable,
            sortable: col.sortable,
            sortArrowPosition: col.sortArrowPosition,
            ...col.headerCell,
        };
    }
}
