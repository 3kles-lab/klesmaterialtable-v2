import { computed, Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { COLUMNS } from '../../../token';
import { KlesColumnConfig } from '../../../core/table/column.interface';
import { EventsService } from '../events/events.service';

@Injectable()
export class ColumnsService {
    public displayedColumns!: Signal<string[]>;

    constructor(
        @Inject(COLUMNS) private _columns: WritableSignal<KlesColumnConfig[]>,
        private readonly eventsService: EventsService,
    ) {}

    public register() {
        this.setDisplayedColumns();
    }

    get columns(): Signal<KlesColumnConfig[]> {
        return this._columns.asReadonly();
    }

    public readonly stickyStartBoundary = computed<string | undefined>(() => {
        return this.getVisibleColumns()
            .filter((column) => column.sticky === true)
            .at(-1)?.columnDef;
    });

    public readonly stickyEndBoundary = computed<string | undefined>(() => {
        return this.getVisibleColumns()
            .filter((column) => column.stickyEnd === true)
            .at(0)?.columnDef;
    });

    public getVisible(): string[] {
        return this.getVisibleColumns().map((column) => column.columnDef);
    }

    public setVisible(columnDef: string, visible: boolean): void {
        this.updateColumn(columnDef, { visible });

        this.eventsService.emit('columnVisibilityChange', {
            columnDef,
            columns: this.getVisible(),
            visible,
        });
    }

    public toggleVisible(columnDef: string): void {
        const visible = this._columns().find((col) => col.columnDef === columnDef)?.visible;
        this.setVisible(columnDef, visible === undefined ? false : !visible);
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
        this.setResizable(columnDef, resizable === undefined ? true : !resizable);
    }

    public setSticky(columnDef: string, options: { sticky?: boolean; stickyEnd?: boolean }) {
        this.updateColumn(columnDef, {
            ...(options.sticky !== undefined && { sticky: options.sticky }),
            ...(options.stickyEnd !== undefined && { stickyEnd: options.stickyEnd }),
        });
    }

    public setColumnPosition(columnDef: string, position: number): void {
        const columns = this._columns();
        const previousIndex = columns.findIndex((column) => column.columnDef === columnDef);

        if (previousIndex < 0 || columns.length < 2 || !Number.isFinite(position)) return;

        const currentIndex = Math.min(columns.length - 1, Math.max(0, Math.trunc(position)));
        if (previousIndex === currentIndex) return;

        const reorderedColumns = [...columns];
        const [column] = reorderedColumns.splice(previousIndex, 1);
        reorderedColumns.splice(currentIndex, 0, column);
        this._columns.set(reorderedColumns);

        this.eventsService.emit('columnOrderChange', {
            previousIndex,
            currentIndex,
            columns: this.getVisible(),
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
            return this.getVisibleColumns().map((column) => column.columnDef);
        });
    }

    private getVisibleColumns(): KlesColumnConfig[] {
        return this._columns().filter((column) => {
            if (column.visibleWhen !== undefined) {
                return column.visibleWhen();
            }

            return column.visible !== false;
        });
    }
}
