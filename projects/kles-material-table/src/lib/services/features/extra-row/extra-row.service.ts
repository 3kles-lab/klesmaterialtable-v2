import { computed, Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { EXTRA_ROWS } from '../../../token';
import { ExtraRowConfig } from '../../../core/table/config.interface';
import { KlesExtraCellFieldConfig } from '../../../core/table/cell.interface';
import { FormGroup } from '@angular/forms';
import { ColumnsService } from '../columns/columns.service';
import { KlesForm } from '../table/form';
import { GroupUiState } from '@3kles/kles-material-dynamicforms';
import { ExpandedRowStore } from '../../store/expanded-row-store.service';

@Injectable()
export class ExtraRowService {
    public displayedExtraColumns: Signal<string[]>;
    public multiTemplateDataRows: Signal<boolean>;
    public rows: Signal<(ExtraRowConfig & { displayedColumns: string[] })[]>;

    constructor(
        @Inject(EXTRA_ROWS) private _extraRowsConfig: WritableSignal<ExtraRowConfig[]>,
        private columnsService: ColumnsService,
        private fm: KlesForm,
        private expandedRowStore: ExpandedRowStore,
    ) {
        this.multiTemplateDataRows = computed(() => this._extraRowsConfig().length > 0);
        this.rows = computed(() =>
            this._extraRowsConfig().map((config) => ({
                ...config,
                when: this.createWhen(config),
                displayedColumns: config.cells.map((cel) => cel.columnDef),
            })),
        );
    }

    public extraColumns(): KlesExtraCellFieldConfig[] {
        return this._extraRowsConfig()
            .flatMap((config) => config.cells)
            .filter(Boolean);
    }

    private createWhen(config: ExtraRowConfig): (index: number, row: FormGroup<any>) => boolean {
        if (config.mode === 'expand') {
            const cols = this.columnsService.columns()?.filter((col) => col.canExpand) ?? [];
            return (_, row) => {
                return this.expandedRowStore.isExpanded(row.value._id);
                // return cols.some((col) => {
                //     return (this.fm.uiStore.get(row) as GroupUiState)?.get(col.columnDef).value()?.expanded || false;
                // });
            };
        } else {
            return config?.when;
        }
    }
}
