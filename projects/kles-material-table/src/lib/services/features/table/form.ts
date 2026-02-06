import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { RowFormFactory } from './row-factory.service';
import * as _ from 'lodash';

@Injectable()
export class KlesForm {
    readonly form = new FormGroup({
        header: new FormGroup({}),
        rows: new FormArray<FormGroup>([]),
        footer: new FormGroup({}),
    });

    constructor(
        private columnsService: ColumnsService,
        private rowFactory: RowFormFactory,
    ) {}

    public getRows(): FormArray<FormGroup> {
        return this.form.get('rows') as FormArray<FormGroup>;
    }

    public getHeader(): FormGroup {
        return this.form.get('header') as FormGroup;
    }

    public getFooter(): FormGroup {
        return this.form.get('footer') as FormGroup;
    }

    public setRows(rows: FormGroup[]) {
        this.getRows().clear();
        rows.forEach((r) => this.getRows().push(r));
    }

    public setHeaderControl(name: string, header: AbstractControl, options?: { emitEvent?: false }): void {
        this.getHeader().setControl(name, header, options);
    }

    public setFooterControl(name: string, footer: AbstractControl, options?: { emitEvent?: false }): void {
        this.getFooter().setControl(name, footer, options);
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

            const control = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.setHeaderControl(colCellHeader.name, control, { emitEvent: false });
        });

        this.columnsService
            .columns()
            .filter((column) => column.footerCell != undefined)
            .forEach((column) => {
                const { pipeTransform, ...tmpCell } = column.footerCell;
                let colCellFooter = _.cloneDeep(tmpCell);
                colCellFooter.name = column.columnDef;
                const control = this.rowFactory.createControl(colCellFooter, colCellFooter.value);
                this.setFooterControl(colCellFooter.name, control, { emitEvent: false });
            });
    }
}
