import { AbstractUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { TABLE_SERVICE } from '../token';
import { ITableService } from '../services/features/table/table.service';

@Pipe({
    name: 'uiField',
    standalone: true,
})
export class UiFieldPipe implements PipeTransform {
    private tableService = inject<ITableService>(TABLE_SERVICE);

    transform(control: FormGroup): GroupUiState;
    transform(control: AbstractControl | null | undefined): AbstractUiState | undefined;
    transform(control: AbstractControl | null | undefined): AbstractUiState | undefined {
        if (!control) return undefined;
        return this.tableService?.klesForm.uiStore.get(control);
    }
}
