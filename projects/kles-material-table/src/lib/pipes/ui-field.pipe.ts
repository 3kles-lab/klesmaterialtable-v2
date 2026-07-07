import { AbstractUiState, IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { TABLE_SERVICE } from '../token';
import { ITableService } from '../services/features/table/table.service';

@Pipe({
    name: 'uiField',
    standalone: true,
})
export class UiFieldPipe implements PipeTransform {
    private tableService = inject<ITableService>(TABLE_SERVICE);

    transform(control: AbstractControl | null | undefined): AbstractUiState | undefined {
        if (!control) return undefined;
        return this.tableService?.klesForm.uiStore.get(control);
    }
}
