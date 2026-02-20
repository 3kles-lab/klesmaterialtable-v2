import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { Pipe, PipeTransform } from '@angular/core';
import { KlesColumnConfig } from '../core/table/column.interface';
import { KlesExtraCellFieldConfig } from '../core/table/cell.interface';

@Pipe({
    name: 'cellField',
    standalone: true,
})
export class CellFieldPipe implements PipeTransform {
    transform(col: KlesColumnConfig | null | undefined): (IKlesFieldConfig & { canExpand?: boolean }) | null {
        if (!col) return null;
        return { name: col.columnDef, canExpand: col.canExpand, ...col.cell };
    }
}

@Pipe({
    name: 'extraCellField',
    standalone: true,
})
export class ExtraCellFieldPipe implements PipeTransform {
    transform(col: KlesExtraCellFieldConfig | null | undefined): IKlesFieldConfig | null {
        if (!col) return null;
        return { name: col.columnDef, ...col };
    }
}
