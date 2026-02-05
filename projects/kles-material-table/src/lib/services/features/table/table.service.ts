import { Inject, Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { DATASOURCE_SERVICE, LINES_SERVICE, LINESLOADER_SERVICE, SELECTION_SERVICE } from '../../../token';
import { KlesForm } from './form';
import { IDatasourceService } from '../datasource/datasource.service';
import { HeaderService } from '../header/header.service';
import { ILinesService } from '../lines/lines.service';
import { ILinesLoader } from '../lines/lines-loader.service';
import { ISelectionService } from '../selection/selection.service';

export interface ITableService {
    readonly form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;
    trackBy: (_: number, row: FormGroup) => any;
}

@Injectable()
export class TableService implements ITableService {
    public form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    constructor(
        private columnsService: ColumnsService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: IDatasourceService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        private fm: KlesForm,
        private headerService: HeaderService,
        @Inject(SELECTION_SERVICE) private selectionService: ISelectionService,
    ) {
        this.columnsService.register();
        this.fm.init();
        this.datasourceService.register();
        this.headerService.register();
        this.linesService.register();
        this.selectionService.register();
        this.form = this.fm.form;
    }
}
