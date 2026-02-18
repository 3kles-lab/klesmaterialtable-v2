import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { RowFormFactory } from './row-factory.service';
import * as _ from 'lodash';
import { AbstractUiState, ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';

@Injectable()
export class KlesForm {
    readonly form = new FormGroup({
        header: new FormGroup({}),
        rows: new FormArray<FormGroup>([]),
        footer: new FormGroup({}),
    });

    readonly ui = new GroupUiState({
        header: new GroupUiState({}),
        rows: new ArrayUiState([]),
        footer: new GroupUiState({}),
    });

    readonly uiStore = new WeakMap<AbstractControl, AbstractUiState>();

    constructor(
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
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

    public setRows(rows: { formGroup: FormGroup; groupUi: GroupUiState }[]) {
        this.getRows().clear();
        rows.forEach((r) => {
            this.uiStore.set(r.formGroup, r.groupUi);
            this.getRows().push(r.formGroup);
            this.getUiRows().push(r.groupUi);
        });
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
            const { pipeTransform, ...tmpCell } = column.headerCell;
            let colCellHeader = _.cloneDeep(tmpCell);
            colCellHeader = { pipeTransform, ...colCellHeader };
            colCellHeader.name = column.columnDef;

            const { control, ui } = this.rowFactory.createControl(colCellHeader, colCellHeader.value); //TODO
            this.setHeaderControl(colCellHeader.name, control, { emitEvent: false });
            this.setHeaderUi(colCellHeader.name, ui);
            this.uiStore.set(control, ui);
        });

        this.columnsService
            .columns()
            .filter((column) => column.footerCell != undefined)
            .forEach((column) => {
                const { pipeTransform, ...tmpCell } = column.footerCell;
                let colCellFooter = _.cloneDeep(tmpCell);
                colCellFooter.name = column.columnDef;
                const { control, ui } = this.rowFactory.createControl(colCellFooter, colCellFooter.value); //TODO
                this.setFooterControl(colCellFooter.name, control, { emitEvent: false });
                this.setFooterUi(colCellFooter.name, ui);
                this.uiStore.set(control, ui);
            });
    }
}
