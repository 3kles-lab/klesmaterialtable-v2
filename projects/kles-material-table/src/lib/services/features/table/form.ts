import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { KlesCreatedRow, RowFormFactory } from './row-factory.service';
import * as _ from 'lodash';
import { AbstractUiState, ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { Subject } from 'rxjs';
import { RowContextStore } from '../../store/row-context-store.service';

@Injectable()
export class KlesForm {
    readonly form = new FormGroup({
        header: new FormGroup({}),
        rows: new FormArray<FormGroup>([]),
        footer: new FormGroup({}),
    });

    readonly ui = new GroupUiState({
        header: new GroupUiState({}),
        rows: new ArrayUiState<any>([]),
        footer: new GroupUiState({}),
    });

    readonly uiStore = new WeakMap<AbstractControl, AbstractUiState>();

    private readonly rowsStructureChangedSubject = new Subject<void>();

    public readonly rowsStructureChanged$ = this.rowsStructureChangedSubject.asObservable();

    constructor(
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
        private rowContextStore: RowContextStore,
    ) {}

    public getRows(): FormArray<FormGroup> {
        return this.form.get('rows') as FormArray<FormGroup>;
    }

    public getUiRows(): ArrayUiState {
        return this.ui.get('rows') as ArrayUiState;
    }

    public getUiHeader(): GroupUiState {
        return this.ui.get('header') as GroupUiState;
    }

    public getUiFooter(): GroupUiState {
        return this.ui.get('footer') as GroupUiState;
    }

    public getHeader(): FormGroup {
        return this.form.get('header') as FormGroup;
    }

    public getFooter(): FormGroup {
        return this.form.get('footer') as FormGroup;
    }

    public setRows(rows: KlesCreatedRow[]) {
        this.getRows().controls.forEach((row) => {
            this.rowContextStore.delete(row);
        });

        this.getRows().clear({ emitEvent: false });
        this.getUiRows().clear();
        rows.forEach((r) => {
            this.uiStore.set(r.formGroup, r.groupUi);
            this.rowContextStore.set(r.formGroup, r.context);
            this.getRows().push(r.formGroup, { emitEvent: false });
            this.getUiRows().push(r.groupUi);
        });
        this.notifyRowsStructureChanged();
    }

    private insertRowAndNotify(
        row: KlesCreatedRow,
        index?: number,
        options?: { emitEvent?: boolean },
        notify?: boolean,
    ): { formGroup: FormGroup; groupUi: GroupUiState } {
        this.uiStore.set(row.formGroup, row.groupUi);
        this.rowContextStore.set(row.formGroup, row.context);
        if (index !== undefined) {
            this.getRows().insert(index, row.formGroup, options);
            this.getUiRows().insert(index, row.groupUi);
        } else {
            this.getRows().push(row.formGroup, options);
            this.getUiRows().push(row.groupUi);
        }

        if (notify) {
            this.notifyRowsStructureChanged();
        }

        return row;
    }

    public insertRow(row: KlesCreatedRow, index?: number, options?: { emitEvent?: boolean }): { formGroup: FormGroup; groupUi: GroupUiState } {
        return this.insertRowAndNotify(row, index, options, true);
    }

    public insertRows(rows: KlesCreatedRow[], index?: number) {
        rows.forEach((r) => {
            this.insertRowAndNotify(r, index);
        });
        this.notifyRowsStructureChanged();
    }

    public moveRow(row: FormGroup, targetRow: FormGroup): { previousIndex: number; currentIndex: number } | undefined {
        const rows = this.getRows();
        const previousIndex = rows.controls.indexOf(row);
        const targetIndex = rows.controls.indexOf(targetRow);

        if (previousIndex < 0 || targetIndex < 0 || previousIndex === targetIndex) {
            return undefined;
        }

        const rowUi = this.uiStore.get(row) ?? this.getUiRows().at(previousIndex);

        rows.removeAt(previousIndex, { emitEvent: false });
        this.getUiRows().removeAt(previousIndex);

        // En descendant, la suppression décale la cible d'une position : utiliser
        // son index initial insère donc naturellement la ligne après celle-ci.
        rows.insert(targetIndex, row, { emitEvent: false });
        this.getUiRows().insert(targetIndex, rowUi);

        rows.updateValueAndValidity({ emitEvent: true });
        this.notifyRowsStructureChanged();

        return {
            previousIndex,
            currentIndex: rows.controls.indexOf(row),
        };
    }

    public updateRow(_id: number | string, value: any, options?: { emitEvent?: boolean; onlySelf?: boolean }) {
        const row = this.getRows().controls.find((c) => c.getRawValue()._id === _id);

        if (row) {
            const oldValue = row.getRawValue();
            row.patchValue({ ...(value ?? {}), _id: oldValue._id }, options);
            return row;
        }

        return undefined;
    }

    public resetRow(_id: number | string, value?: any, options?: { onlySelf?: boolean; emitEvent?: boolean; overwriteDefaultValue?: boolean }) {
        const row = this.getRows().controls.find((c) => c.getRawValue()._id === _id);

        if (row) {
            const oldValue = row.getRawValue();
            row.reset({ ...(value ?? {}), _id: oldValue._id }, options);
        }
    }

    public deleteRowById(id: number | string, option?: { emitEvent?: boolean }) {
        const index = this.getRows().controls.findIndex((c) => c.getRawValue()._id === id);
        if (index !== -1) {
            const row = this.getRows().at(index);

            this.getRows().removeAt(index, option);
            this.rowContextStore.delete(row);
            this.getUiRows().removeAt(index);
            this.notifyRowsStructureChanged();
        }
    }

    public setHeaderControl(name: string, header: AbstractControl, options?: { emitEvent?: false }): void {
        this.getHeader().setControl(name, header, options);
    }

    public setFooterControl(name: string, footer: AbstractControl, options?: { emitEvent?: false }): void {
        this.getFooter().setControl(name, footer, options);
    }

    public setHeaderUi(name: string, header: AbstractUiState): void {
        this.getUiHeader().addUiState(name, header);
    }

    public setFooterUi(name: string, footer: AbstractUiState): void {
        this.getUiFooter().addUiState(name, footer);
    }

    public get rows(): FormGroup[] {
        return this.getRows().controls as FormGroup[];
    }

    public init() {
        this.columnsService.columns().forEach((column) => {
            let colCellHeader: any = {};
            if (column.headerCell?.field) {
                const { pipeTransform, ...tmpCell } = column.headerCell.field;
                colCellHeader = _.cloneDeep(tmpCell);
                colCellHeader = { pipeTransform, ...colCellHeader };
            }

            colCellHeader.name = column.columnDef;

            const { control, ui } = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.setHeaderControl(colCellHeader.name, control, { emitEvent: false });
            this.setHeaderUi(colCellHeader.name, ui);
            this.uiStore.set(control, ui);
        });

        this.columnsService
            .columns()
            .filter((column) => column.footerCell)
            .forEach((column) => {
                let colCellFooter: any = {};
                if (column.footerCell?.field) {
                    const { pipeTransform, ...tmpCell } = column.footerCell.field;
                    colCellFooter = _.cloneDeep(tmpCell);
                }
                colCellFooter.name = column.columnDef;
                const { control, ui } = this.rowFactory.createControl(colCellFooter, colCellFooter.value);
                this.setFooterControl(colCellFooter.name, control, { emitEvent: false });
                this.setFooterUi(colCellFooter.name, ui);
                this.uiStore.set(control, ui);
            });
    }

    private notifyRowsStructureChanged(): void {
        this.rowsStructureChangedSubject.next();
    }
}
