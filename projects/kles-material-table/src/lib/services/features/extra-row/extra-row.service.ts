import { computed, Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { EXTRA_ROWS } from '../../../token';
import { ExtraRowConfig } from '../../../core/table/config.interface';
import { FormGroup } from '@angular/forms';
import { ExpandedRowStore } from '../../store/expanded-row-store.service';
import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';

@Injectable()
export class ExtraRowService {
    public multiTemplateDataRows: Signal<boolean>;
    public rows: Signal<(ExtraRowConfig & { displayedColumns: string[] })[]>;

    constructor(
        @Inject(EXTRA_ROWS) private _extraRowsConfig: WritableSignal<ExtraRowConfig[]>,
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

    public extraFields(): IKlesFieldConfig[] {
        return this._extraRowsConfig()
            .flatMap((config) => config.cells)
            .filter(Boolean)
            .map((cell) => ({ ...cell.field, name: cell.columnDef }));
    }

    private createWhen(config: ExtraRowConfig): ((index: number, row: FormGroup<any>) => boolean) | undefined {
        if (config.mode === 'expand') {
            return (_, row) => {
                return this.expandedRowStore.isExpanded(row.getRawValue()._id);
            };
        } else {
            return config?.when;
        }
    }
}
