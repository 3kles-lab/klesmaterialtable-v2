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


    private loading = new Set<string>();

    private readonly _expandedIds$ = new BehaviorSubject<Set<string>>(new Set());
    public readonly expandedIds$ = this._expandedIds$.asObservable();

    
    private findParentIndex(id: string): number {
        return this.fm.getRows().controls.findIndex((c) => c.getRawValue()._id === id);
    }

    toggle(id: string, group: FormGroup, depth: number): void {
        const expanded = new Set(this._expandedIds$.value);

        if (expanded.has(id)) {
            this.fm
                .getRows()
                .controls.filter((control) => control.getRawValue()._parentId === id)
                .map((control) => control.getRawValue()._id)
                .forEach((_id) => this.fm.deleteRowById(_id));

            expanded.delete(id);
            this._expandedIds$.next(expanded);
        } else {
            const index = this.findParentIndex(id);

            this.loaderChildrensService.load(group, depth).subscribe((response) => {
                if (response.loading) {
                    this.loading.add(id);
                    // this.loadingService.start();
                } else {
                    this.loading.delete(id);
                    // this.loadingService.stop();
                    console.log( (group.getRawValue()._depth ?? 0) + 1)
                    this.fm.insertRows(
                        this.rowFactory.createRows(
                            this.columnsService.columns().map((col) => ({ ...col.cell.field, name: col.columnDef })),
                            response.items,
                            { depth: (group.getRawValue()._depth ?? 0) + 1, parentId: id },
                        ),
                        index + 1,
                    );
                    expanded.add(id);
                    this._expandedIds$.next(expanded);
                }
            });
        }
    }

    public hasChildren(group: FormGroup, depth: number): boolean {
        return this.loaderConfig.lines.hasChildren?.(group, depth) ?? true;
    }
}
