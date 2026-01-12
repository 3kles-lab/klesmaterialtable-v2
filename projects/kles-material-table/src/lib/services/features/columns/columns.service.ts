import { computed, Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { COLUMNS } from '../../../token';
import { KlesColumnConfig } from '../../../core/table/column.interface';

@Injectable()
export class ColumnsService {
    public displayedColumns: Signal<string[]>;

    constructor(@Inject(COLUMNS) private _columns: WritableSignal<KlesColumnConfig[]>) {
        this.setDisplayedColumns();
    }

    get columns(): Signal<KlesColumnConfig[]> {
        return this._columns.asReadonly();
    }

    public setVisible(columnDef: string, visible: boolean): void {
        this._columns.update((columns) => columns.map((col) => (col.columnDef === columnDef ? { ...col, visible } : col)));
    }

    public toggleVisible(columnDef: string): void {
        this._columns.update((columns) =>
            columns.map((col) => (col.columnDef === columnDef ? { ...col, visible: col.visible === undefined ? false : !col.visible } : col)),
        );
    }

    private setDisplayedColumns(): void {
        this.displayedColumns = computed(() => {
            return this._columns()
                .filter((c) => {
                    if (c.visibleWhen !== undefined) {
                        return c.visibleWhen();
                    } else if (c.visible !== undefined) {
                        return c.visible !== false;
                    }
                    return true;
                })
                .map((c) => c.columnDef);
        });
    }
}
