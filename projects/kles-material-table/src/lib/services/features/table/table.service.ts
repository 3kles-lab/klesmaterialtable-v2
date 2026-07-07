import { EventEmitter, Inject, Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { DATASOURCE_SERVICE, HEADER_SERVICE, LINES_SERVICE, SCROLLBAR_ORCHESTRATOR_SERVICE, SELECTION_SERVICE } from '../../../token';
import { KlesForm } from './form';
import { IDatasourceService } from '../datasource/datasource.service';
import { IHeaderService } from '../header/header.service';
import { ILinesService } from '../lines/lines.service';
import { ISelectionService } from '../selection/selection.service';
import { LoadingOrchestratorService } from '../loading/loading-orchestrator.service';
import { IScrollbarOrchestratorService } from '../scrollbar/scrollbar-orchestrator.service';
import { AbstractUiState, ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';

export interface ITableService {
    readonly form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;
    readonly ui: GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState<any, any, any>;
        footer: GroupUiState;
    }>;

    klesForm: KlesForm;

    trackBy: (_: number, row: FormGroup) => any;
}

@Injectable()
export class TableService implements ITableService {
    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    constructor(
        public readonly klesForm: KlesForm,
        private readonly columnsService: ColumnsService,
        @Inject(DATASOURCE_SERVICE) private readonly datasourceService: IDatasourceService,
        @Inject(LINES_SERVICE) private readonly linesService: ILinesService,
        @Inject(HEADER_SERVICE) private readonly headerService: IHeaderService,
        @Inject(SELECTION_SERVICE) private readonly selectionService: ISelectionService,
        private readonly loadingOrchestratorService: LoadingOrchestratorService,
        @Inject(SCROLLBAR_ORCHESTRATOR_SERVICE) private readonly scrollbarOrchestratorService: IScrollbarOrchestratorService,
    ) {
        this.orchestrators();
        this.features();
    }

    public get ui() {
        return this.klesForm.ui;
    }

    public get form() {
        return this.klesForm.form;
    }

    private orchestrators() {
        this.scrollbarOrchestratorService.register();
        this.loadingOrchestratorService.register();
    }

    private features() {
        this.columnsService.register();
        this.klesForm.init();
        this.datasourceService.register();
        this.headerService.register();
        this.linesService.register();
        this.selectionService.register();
    }
}
