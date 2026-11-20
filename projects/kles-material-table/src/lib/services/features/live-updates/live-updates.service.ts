import { DestroyRef, ErrorHandler, inject, Injectable, InjectionToken } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { auditTime, defer, Subject, tap } from 'rxjs';
import { RowsFormApi } from '../../../core/api/form';
import { Query } from '../../../core/query/query.interface';
import { LiveUpdatesConfig, TableDataChange } from '../../../core/table/live-updates.interface';
import { RowId } from '../../../core/table/selection-config.interface';
import { DATASOURCE_SERVICE, LOADER_SERVICE } from '../../../token';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { SortStore } from '../../store/sort-store.service';
import { PaginatorService } from '../paginator/paginator.service';

export const LIVE_UPDATES_CONFIG = new InjectionToken<LiveUpdatesConfig<unknown>>('LIVE_UPDATES_CONFIG');

@Injectable()
export class LiveUpdatesService {
    private readonly config = inject(LIVE_UPDATES_CONFIG);
    private readonly loader = inject(LOADER_SERVICE);
    private readonly datasource = inject(DATASOURCE_SERVICE);
    private readonly paginator = inject(PaginatorService);
    private readonly paginatorStore = inject(PaginatorStore, { optional: true });
    private readonly sortStore = inject(SortStore);
    private readonly filterStore = inject(FilterStore);
    private readonly destroyRef = inject(DestroyRef);
    private readonly errorHandler = inject(ErrorHandler);
    private readonly checkRefresh$ = new Subject<void>();
    private readonly patchesDuringLoad = new Map<RowId, { changes: Record<string, unknown>; row?: FormGroup }>();
    private loading = false;
    private refreshPending = false;

    public register(rows: RowsFormApi): void {
        this.checkRefresh$.pipe(auditTime(0), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            if (this.refreshPending && !this.loading) {
                this.refreshPending = false;
                this.loading = true;
                this.loader.refresh({ showLoading: false });
            }
        });

        this.loader.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ loading }) => {
            this.loading = loading;
            if (!loading) {
                this.applyPatchesToLoadedRows(rows);
                if (this.refreshPending) {
                    this.checkRefresh$.next();
                }
            }
        });

        defer(() => this.config.events())
            .pipe(
                tap((event) => this.handleChange(event, rows)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe({ error: (error: unknown) => this.errorHandler.handleError(error) });
    }

    private handleChange(event: TableDataChange<unknown>, rows: RowsFormApi): void {
        if (event.type === 'updated' && this.config.shouldRefresh?.(event, this.query()) === false) {
            if (this.loading) {
                const previous = this.patchesDuringLoad.get(event.id);
                this.patchesDuringLoad.set(event.id, {
                    row: previous ? previous.row : rows.get(event.id),
                    changes: { ...previous?.changes, ...event.changes },
                });
            }
            if (rows.patch(event.id, event.changes)) {
                this.datasource.refreshView?.();
            }
            return;
        }

        if (event.type === 'updated' || event.type === 'deleted') {
            this.patchesDuringLoad.delete(event.id);
        }
        this.refreshPending = true;
        this.checkRefresh$.next();
    }

    private applyPatchesToLoadedRows(rows: RowsFormApi): void {
        const pending = [...this.patchesDuringLoad];
        this.patchesDuringLoad.clear();

        // A response can replace the rows with data fetched before an event arrived.
        let viewChanged = false;
        for (const [id, { changes, row }] of pending) {
            const loadedRow = rows.get(id);
            if (loadedRow && loadedRow !== row) {
                rows.patch(id, changes);
                viewChanged = true;
            }
        }
        if (viewChanged) {
            this.datasource.refreshView?.();
        }
    }

    private query(): Query {
        const paginator = this.paginator.paginator;
        const pagination = paginator ? { page: paginator.pageIndex, perPage: paginator.pageSize } : this.paginatorStore?.snapshot();
        const sort = this.sortStore.snapshot();
        return { pagination: pagination && { ...pagination }, sort: sort && { ...sort }, filters: { ...this.filterStore.snapshot() } };
    }
}
