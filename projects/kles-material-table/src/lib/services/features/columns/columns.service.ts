import { computed, Inject, Injectable, Signal, WritableSignal } from '@angular/core';
import { COLUMNS } from '../../../token';
import { KlesColumnConfig } from '../../../core/table/column.interface';
import { EventsService } from '../events/events.service';

@Injectable()
export class ColumnsService {
    public displayedColumns: Signal<string[]> | undefined;

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

    public getVisible(): string[] {
        return this.columns()
            .filter((column) => column.visible !== false)
            .map((column) => column.columnDef);
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
            ...(options.sticky && { sticky: options.sticky }),
            ...(options.stickyEnd && { stickyEnd: options.stickyEnd }),
        });
    }

    public setColumnPosition(columnDef: string, position: number) {
        const previousIndex = this._columns().findIndex((c) => c.columnDef === columnDef);

        this._columns.update((columns) => {
            if (previousIndex >= 0 && position >= 0 && previousIndex != position) {
                const currentElement = columns.at(position);
                const [val] = columns.splice(previousIndex, 1);
                const newCurrentElementPosition = columns.findIndex((c) => c.columnDef === currentElement?.columnDef);
                columns.splice(newCurrentElementPosition, 0, val);

                return [...columns];
            } else {
                return columns;
            }
        });

        this.eventsService.emit('columnOrderChange', {
            previousIndex: previousIndex,
            columns: this.getVisible(),
            currentIndex: position,
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
