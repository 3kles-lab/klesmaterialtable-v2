import { computed, Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { COLUMNS } from '../../../token';
import { KlesColumnConfig } from '../../../core/table/column.interface';

@Injectable()
export class ColumnsService {
    public displayedColumns: Signal<string[]>;

    constructor(@Inject(COLUMNS) private _columns: WritableSignal<KlesColumnConfig[]>) {}

    public register() {
        this.setDisplayedColumns();
    }

    get columns(): Signal<KlesColumnConfig[]> {
        return this._columns.asReadonly();
    }

    public setVisible(columnDef: string, visible: boolean): void {
        this.updateColumn(columnDef, { visible });
    }

    public setCellIndeterminate(columnDef: string, indeterminate: boolean): void {
        this.updateColumn(columnDef, { cell: { indeterminate } });
    }

    public setHeaderCellIndeterminate(columnDef: string, indeterminate: boolean): void {
        this.updateColumn(columnDef, { headerCell: { indeterminate } });
    }

    public toggleVisible(columnDef: string): void {
        const visible = this._columns().find((col) => col.columnDef === columnDef)?.visible;
        this.updateColumn(columnDef, { visible: visible === undefined ? false : !visible });
    }

    public changeWidth(columnDef: string, options: { width?: string; maxWidth?: string; minWidth?: string }) {
        this.updateColumn(columnDef, {
            ...(options.width && { width: options.width }),
            ...(options.maxWidth && { maxWidth: options.maxWidth }),
            ...(options.minWidth && { minWidth: options.minWidth }),
        });
    }

    public setResizable(columnDef: string, resizable: boolean) {
        this.updateColumn(columnDef, { resizable });
    }

    public toggleResizable(columnDef: string): void {
        const resizable = this._columns().find((col) => col.columnDef === columnDef)?.resizable;
        this.updateColumn(columnDef, { resizable: resizable === undefined ? true : !resizable });
    }

    public setSticky(columnDef: string, options: { sticky?: boolean; stickyEnd?: boolean }) {
        this.updateColumn(columnDef, {
            ...(options.sticky && { sticky: options.sticky }),
            ...(options.stickyEnd && { stickyEnd: options.stickyEnd }),
        });
    }

    public setColumnPosition(columnDef: string, position: number) {
        this._columns.update((columns) => {
            const actualIndex = columns.findIndex((c) => c.columnDef === columnDef);
            if (actualIndex >= 0 && position >= 0 && actualIndex != position) {
                const currentElement = columns.at(position);
                const [val] = columns.splice(actualIndex, 1);
                const newCurrentElementPosition = columns.findIndex((c) => c.columnDef === currentElement.columnDef);
                columns.splice(newCurrentElementPosition, 0, val);

                return [...columns];
            } else {
                return columns;
            }
        });
    }

    private updateColumn(columnDef: string, config: Partial<KlesColumnConfig>): void {
        this._columns.update((columns) =>
            columns.map((col) =>
                col.columnDef === columnDef
                    ? {
                          ...col,
                          ...config,
                          cell: config.cell ? { ...col.cell, ...config.cell } : col.cell,
                          headerCell: config.headerCell ? { ...col.headerCell, ...config.headerCell } : col.headerCell,
                          footerCell: config.footerCell ? { ...col.footerCell, ...config.footerCell } : col.footerCell,
                      }
                    : col,
            ),
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
