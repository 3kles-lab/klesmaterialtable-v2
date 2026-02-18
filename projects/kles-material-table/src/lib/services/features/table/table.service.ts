import { Inject, Injectable } from '@angular/core';
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
        rows: ArrayUiState;
        footer: GroupUiState;
    }>;

    readonly uiStore: WeakMap<AbstractControl<any, any, any>, AbstractUiState<any, any>>;

    trackBy: (_: number, row: FormGroup) => any;
}

@Injectable()
export class TableService implements ITableService {
    public readonly form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;

    public readonly ui: GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState;
        footer: GroupUiState;
    }>;

    public readonly uiStore: WeakMap<AbstractControl<any, any, any>, AbstractUiState<any, any>>;

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    constructor(
        private columnsService: ColumnsService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: IDatasourceService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        private fm: KlesForm,
        @Inject(HEADER_SERVICE) private headerService: IHeaderService,
        @Inject(SELECTION_SERVICE) private selectionService: ISelectionService,
        private loadingOrchestratorService: LoadingOrchestratorService,
        @Inject(SCROLLBAR_ORCHESTRATOR_SERVICE) private scrollbarOrchestratorService: IScrollbarOrchestratorService,
    ) {
        this.orchestrators();
        this.features();
        this.form = this.fm.form;
        this.ui = this.fm.ui;
        this.uiStore = this.fm.uiStore;
    }

    private orchestrators() {
        this.scrollbarOrchestratorService.register();
        this.loadingOrchestratorService.register();
    }

    private features() {
        this.columnsService.register();
        this.fm.init();
        this.datasourceService.register();
        this.headerService.register();
        this.linesService.register();
        this.selectionService.register();
    }
}
