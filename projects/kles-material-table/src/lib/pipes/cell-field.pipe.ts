import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { Pipe, PipeTransform } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';

@Pipe({
    name: 'cellField',
    standalone: true,
})
export class CellFieldPipe implements PipeTransform {
    transform(col: KlesColumnConfig | null | undefined): IKlesFieldConfig | null {
        if (!col) return null;
        return { name: col.columnDef, ...col.cell };
    }
}
