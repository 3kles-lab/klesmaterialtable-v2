import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { KlesCreatedRow, RowFormFactory } from './row-factory.service';
import * as _ from 'lodash';
import { AbstractUiState, ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { Subject } from 'rxjs';
import { RowContextStore } from '../../store/row-context-store.service';

export interface KlesRowMoveResult {
    previousIndex: number;
    currentIndex: number;
    previousSiblingIndex: number;
    currentSiblingIndex: number;
    movedRows: FormGroup[];
}

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
    private readonly rowsReplacedSubject = new Subject<void>();

    public readonly rowsStructureChanged$ = this.rowsStructureChangedSubject.asObservable();
    public readonly rowsReplaced$ = this.rowsReplacedSubject.asObservable();

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
        this.rowsReplacedSubject.next();
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
        rows.forEach((r, offset) => {
            this.insertRowAndNotify(r, index === undefined ? undefined : index + offset, { emitEvent: false }, false);
        });
        this.getRows().updateValueAndValidity({ emitEvent: true });
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

    public canMoveSubtree(row: FormGroup, targetRow: FormGroup): boolean {
        if (row === targetRow) return true;
        const rowValue = row.getRawValue();
        const targetValue = targetRow.getRawValue();
        if (rowValue._parentId !== targetValue._parentId || (rowValue._depth ?? 0) !== (targetValue._depth ?? 0)) return false;
        return !this.getSubtreeRows(row).includes(targetRow);
    }

    public moveSubtree(row: FormGroup, targetRow: FormGroup): KlesRowMoveResult | undefined {
        const rows = this.getRows();
        const previousIndex = rows.controls.indexOf(row);
        const targetIndex = rows.controls.indexOf(targetRow);
        if (previousIndex < 0 || targetIndex < 0 || previousIndex === targetIndex || !this.canMoveSubtree(row, targetRow)) return undefined;

        const movedRows = this.getSubtreeRows(row);
        const movedSet = new Set(movedRows);
        const movedUis = movedRows.map((movedRow) => this.uiStore.get(movedRow) ?? this.getUiRows().at(rows.controls.indexOf(movedRow)));
        const parentId = row.getRawValue()._parentId;
        const previousSiblingIndex = this.getSiblingIndex(row);

        let targetSubtreeEnd = targetIndex + this.getSubtreeRows(targetRow).length;
        let insertionIndex = previousIndex < targetIndex ? targetSubtreeEnd : targetIndex;

        for (let index = rows.length - 1; index >= 0; index--) {
            if (!movedSet.has(rows.at(index))) continue;
            rows.removeAt(index, { emitEvent: false });
            this.getUiRows().removeAt(index);
            if (index < insertionIndex) insertionIndex--;
        }

        movedRows.forEach((movedRow, offset) => {
            rows.insert(insertionIndex + offset, movedRow, { emitEvent: false });
            this.getUiRows().insert(insertionIndex + offset, movedUis[offset]);
        });

        rows.updateValueAndValidity({ emitEvent: true });
        this.notifyRowsStructureChanged();

        return {
            previousIndex,
            currentIndex: rows.controls.indexOf(row),
            previousSiblingIndex,
            currentSiblingIndex: this.getSiblingIndex(row, parentId),
            movedRows,
        };
    }

    public getSubtreeRows(row: FormGroup): FormGroup[] {
        const rows = this.getRows().controls;
        const index = rows.indexOf(row);
        if (index < 0) return [];

        const depth = row.getRawValue()._depth ?? 0;
        const subtree = [row];
        for (let current = index + 1; current < rows.length; current++) {
            if ((rows[current].getRawValue()._depth ?? 0) <= depth) break;
            subtree.push(rows[current]);
        }
        return subtree;
    }

    private getSiblingIndex(row: FormGroup, parentId = row.getRawValue()._parentId): number {
        return this.getRows()
            .controls.filter((candidate) => candidate.getRawValue()._parentId === parentId)
            .indexOf(row);
    }

    public transferRowTo(target: KlesForm, row: FormGroup, targetRow?: FormGroup): { previousIndex: number; currentIndex: number } | undefined {
        if (target === this) {
            return targetRow ? this.moveRow(row, targetRow) : undefined;
        }

        const previousIndex = this.getRows().controls.indexOf(row);
        if (previousIndex < 0) {
            return undefined;
        }

        const rowUi = this.uiStore.get(row) ?? this.getUiRows().at(previousIndex);
        const rowContext = this.rowContextStore.get(row)?.();
        const targetIndex = targetRow ? target.getRows().controls.indexOf(targetRow) : target.getRows().length;
        const currentIndex = targetIndex < 0 ? target.getRows().length : targetIndex;

        this.getRows().removeAt(previousIndex, { emitEvent: false });
        this.getUiRows().removeAt(previousIndex);
        this.rowContextStore.delete(row);

        target.getRows().insert(currentIndex, row, { emitEvent: false });
        target.getUiRows().insert(currentIndex, rowUi);
        target.uiStore.set(row, rowUi);
        if (rowContext) {
            target.rowContextStore.set(row, rowContext);
        }

        this.getRows().updateValueAndValidity({ emitEvent: true });
        target.getRows().updateValueAndValidity({ emitEvent: true });
        this.notifyRowsStructureChanged();
        target.notifyRowsStructureChanged();

        return { previousIndex, currentIndex };
    }

    public transferSubtreeTo(target: KlesForm, row: FormGroup, targetRow?: FormGroup): KlesRowMoveResult | undefined {
        if (target === this) return targetRow ? this.moveSubtree(row, targetRow) : undefined;

        const previousIndex = this.getRows().controls.indexOf(row);
        if (previousIndex < 0 || (row.getRawValue()._depth ?? 0) !== 0) return undefined;
        if (targetRow && ((targetRow.getRawValue()._depth ?? 0) !== 0 || targetRow.getRawValue()._parentId != null)) return undefined;

        const movedRows = this.getSubtreeRows(row);
        const previousSiblingIndex = this.getSiblingIndex(row);
        const movedData = movedRows.map((movedRow) => ({
            row: movedRow,
            ui: this.uiStore.get(movedRow) ?? this.getUiRows().at(this.getRows().controls.indexOf(movedRow)),
            context: this.rowContextStore.get(movedRow)?.(),
        }));

        for (let index = this.getRows().length - 1; index >= 0; index--) {
            if (!movedRows.includes(this.getRows().at(index))) continue;
            const movedRow = this.getRows().at(index);
            this.getRows().removeAt(index, { emitEvent: false });
            this.getUiRows().removeAt(index);
            this.rowContextStore.delete(movedRow);
        }

        const insertionIndex = targetRow ? target.getRows().controls.indexOf(targetRow) : target.getRows().length;
        movedData.forEach(({ row: movedRow, ui, context }, offset) => {
            target.getRows().insert(insertionIndex + offset, movedRow, { emitEvent: false });
            target.getUiRows().insert(insertionIndex + offset, ui);
            target.uiStore.set(movedRow, ui);
            if (context) target.rowContextStore.set(movedRow, context);
        });

        this.getRows().updateValueAndValidity({ emitEvent: true });
        target.getRows().updateValueAndValidity({ emitEvent: true });
        this.notifyRowsStructureChanged();
        target.notifyRowsStructureChanged();

        return {
            previousIndex,
            currentIndex: target.getRows().controls.indexOf(row),
            previousSiblingIndex,
            currentSiblingIndex: target.getSiblingIndex(row, null),
            movedRows,
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
        this.deleteRowsByIds([id], option);
    }

    public deleteRowsByIds(ids: ReadonlyArray<number | string>, option?: { emitEvent?: boolean }): void {
        const idSet = new Set(ids);
        const indexes = this.getRows()
            .controls.map((row, index) => ({ row, index }))
            .filter(({ row }) => idSet.has(row.getRawValue()._id))
            .map(({ index }) => index)
            .sort((a, b) => b - a);

        if (indexes.length === 0) return;

        for (const index of indexes) {
            const row = this.getRows().at(index);
            this.getRows().removeAt(index, { emitEvent: false });
            this.rowContextStore.delete(row);
            this.getUiRows().removeAt(index);
        }

        this.getRows().updateValueAndValidity(option);
        this.notifyRowsStructureChanged();
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
