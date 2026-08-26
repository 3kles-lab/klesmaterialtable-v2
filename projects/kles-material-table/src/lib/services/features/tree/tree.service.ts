import { computed, inject, Injectable, OnInit, Signal, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { LOADER_CONFIG } from '../../../token';
import { LoaderConfig } from '../../../core/table/config.interface';
import { LoaderChildrensService } from '../loader/loader-childrens.service';
import { BehaviorSubject, catchError, delay } from 'rxjs';
import { LoadingService } from '../loading/loading.service';
import { KlesForm } from '../table/form';
import { ColumnsService } from '../columns/columns.service';
import { RowFormFactory } from '../table/row-factory.service';
import { EventsService } from '../events/events.service';

export interface RowMeta {
    id: string;
    parentId: string | null;
    level: number;
    expandable: boolean;
}

@Injectable()
export class TreeService<T, R> {
    private readonly loaderConfig = inject<LoaderConfig<T, R>>(LOADER_CONFIG);
    private readonly loaderChildrensService = inject(LoaderChildrensService);
    private readonly loadingService = inject(LoadingService);

    private readonly fm = inject(KlesForm);
    private readonly columnsService = inject(ColumnsService);
    private readonly rowFactory = inject(RowFormFactory);
    private readonly eventsService = inject(EventsService);


    private loading = new Set<string>();

    private readonly _expandedIds$ = new BehaviorSubject<Set<string>>(new Set());
    public readonly expandedIds$ = this._expandedIds$.asObservable();

    
    private findParentIndex(id: string): number {
        return this.fm.getRows().controls.findIndex((c) => c.getRawValue()._id === id);
    }

    toggle(id: string, group: FormGroup, depth: number): void {
        const expanded = new Set(this._expandedIds$.value);

        if (expanded.has(id)) {
            const payload = this.rowPayload(group, depth);
            this.fm
                .getRows()
                .controls.filter((control) => control.getRawValue()._parentId === id)
                .map((control) => control.getRawValue()._id)
                .forEach((_id) => this.fm.deleteRowById(_id));

            expanded.delete(id);
            this._expandedIds$.next(expanded);
            this.eventsService.emit('nodeCollapse', payload);
        } else {
            const index = this.findParentIndex(id);
            const payload = this.rowPayload(group, depth);
            this.eventsService.emit('nodeLoadChildren', payload);

            this.loaderChildrensService.load(group, depth).subscribe((response) => {
                if (response.loading) {
                    this.loading.add(id);
                    // this.loadingService.start();
                } else {
                    this.loading.delete(id);
                    if (response.error) {
                        this.eventsService.emit('loadError', {
                            error: response.error,
                            message: response.error?.message,
                        });
                        return;
                    }
                    // this.loadingService.stop();
                    // console.log( (group.getRawValue()._depth ?? 0) + 1)
                    this.fm.insertRows(
                        this.rowFactory.createRows(
                            this.columnsService.columns().map((col) => ({ ...col.cell?.field, name: col.columnDef })),
                            response.items,
                            { depth: (group.getRawValue()._depth ?? 0) + 1, parentId: id },
                        ),
                        index + 1,
                    );
                    expanded.add(id);
                    this._expandedIds$.next(expanded);
                    this.eventsService.emit('nodeChildrenLoaded', payload);
                    this.eventsService.emit('nodeExpand', payload);
                }
            });
        }
    }

    public hasChildren(group: FormGroup, depth: number): boolean {
        return this.loaderConfig.lines.hasChildren?.(group, depth) ?? true;
    }

    private rowPayload(row: FormGroup, level: number) {
        return {
            row,
            rowIndex: this.fm.getRows().controls.indexOf(row),
            value: row.value,
            rawValue: row.getRawValue(),
            level,
        };
    }
}
