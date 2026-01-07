import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { IKlesDataSource } from '../../core/datasource/datasource.interface';
import { MatSort, SortDirection } from '@angular/material/sort';
import { DestroyRef, Inject, inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { LoaderService } from '../../services/loader.service';
import { PaginatorStore } from '../../services/store/paginator-store.service';
import { SortStore } from '../../services/store/sort-store.service';
import { FilterStore } from '../../services/store/filter-store.service';
import { FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RowFormFactory } from '../../services/row-factory.service';
import { KlesForm } from './form';
import { COLUMNS } from '../../core/table/token';
import { KlesColumnConfig } from '../../core/table/column.interface';
import * as _ from 'lodash';
import { SortService } from '../../services/features/sort/sort.service';
import { FilterService } from '../../services/features/filter/filter.service';

@Injectable()
export class KlesDataSource extends MatTableDataSource<FormGroup, MatPaginator> implements IKlesDataSource {
    _loading$ = new BehaviorSubject(false);
    loading$ = this._loading$.asObservable();

    form: FormGroup;

    private subscription: Subscription;
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        @Inject(COLUMNS) private columns: KlesColumnConfig[],
        private fm: KlesForm,
        private loaderService: LoaderService<any, any>,
        @Optional() private paginatorStore: PaginatorStore | null,
        private rowFactory: RowFormFactory,
        private sortService: SortService,
        private filterService: FilterService,
    ) {
        super([]);

        this.form = this.fm.form;

        columns.forEach((column) => {
            const { pipeTransform, ...tmpCell } = column.headerCell;
            let colCellHeader = _.cloneDeep(tmpCell);
            colCellHeader = { pipeTransform, ...colCellHeader };
            colCellHeader.name = column.columnDef;
            const control = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.fm.getHeader().addControl(colCellHeader.name, control);
        });

        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.data = this.fm.rows;
            });

        this.filterPredicate = this.filterService.createFilter(columns);
        this.fm
            .getHeader()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.filter = this.filterService.prepareFilterData(this.fm.getHeader());
            });
        this.filter = this.filterService.prepareFilterData(this.fm.getHeader());

        this.sortingDataAccessor = this.sortService.sortingDataAccessor;

        this.subscription = this.loaderService
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this._loading$.next(true);
                } else {
                    this._loading$.next(false);
                    this.fm.setRows(
                        this.rowFactory.createRows(
                            this.columns.map((col) => ({ ...col.cell, name: col.columnDef })),
                            response.items,
                        ),
                    );
                    this.data = this.fm.rows;
                    /**
                     * TODO afficher message d'erreur
                     */
                }
            });
    }

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    setPage(page: number, perPage: number): void {
        if (!this.paginator) {
            return;
        }
        this.paginator.pageIndex = page;
        this.paginator.pageSize = perPage;
    }

    setSort(active: string, direction: SortDirection): void {
        if (!this.sort) return;
        this.sort.active = active;
        this.sort.direction = direction;
    }

    setFilters(filters: { [key: string]: any }): void {
        this.fm.getHeader().patchValue(filters);
        if (this.paginator) this.paginator.firstPage();
    }

    refresh(): void {
        this.loaderService.refresh();
    }

    disconnect(): void {
        super.disconnect();
        this._loading$.complete();
        this.subscription.unsubscribe();
    }

    sortData: (data: FormGroup[], sort: MatSort) => FormGroup[] = (data: FormGroup[], sort: MatSort): FormGroup[] => {
        const active = sort.active;
        const direction = sort.direction;

        if (!active || direction == '') {
            return data;
        }
        const column = this.columns.find((col) => col.columnDef === active);

        return data.sort((a, b) => {
            let valueA: string | number;
            let valueB: string | number;
            if (column?.headerCell.sortPredicate) {
                valueA = column?.headerCell.sortPredicate(a);
                valueB = column?.headerCell.sortPredicate(b);
            } else {
                valueA = this.sortingDataAccessor(a, active);
                valueB = this.sortingDataAccessor(b, active);

                if (column?.cell?.property) {
                    valueA = valueA?.[column.cell?.property];
                    valueB = valueB?.[column.cell?.property];
                }
            }

            const valueAType = typeof valueA;
            const valueBType = typeof valueB;

            if (valueAType !== valueBType) {
                if (valueAType === 'number') {
                    valueA += '';
                }
                if (valueBType === 'number') {
                    valueB += '';
                }
            }

            let comparatorResult = 0;
            if (valueA != null && valueB != null) {
                if (valueA > valueB) {
                    comparatorResult = 1;
                } else if (valueA < valueB) {
                    comparatorResult = -1;
                }
            } else if (valueA != null) {
                comparatorResult = 1;
            } else if (valueB != null) {
                comparatorResult = -1;
            }
            return comparatorResult * (direction == 'asc' ? 1 : -1);
        });
    };

    override get paginator(): MatPaginator | null | undefined {
        return super.paginator;
    }

    override set paginator(paginator: MatPaginator | null | undefined) {
        super.paginator = paginator;

        if (super.paginator) {
            this.paginator.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
                this.paginatorStore?.setPage({ page: event.pageIndex, perPage: event.pageSize });
            });
        }
    }
}

@Injectable()
export class KlesLazyDataSource implements IKlesDataSource {
    private _loading$ = new BehaviorSubject(false);
    loading$ = this._loading$.asObservable();

    private _paginator: MatPaginator;
    private _sort: MatSort;

    form: FormGroup;

    private readonly destroyRef = inject(DestroyRef);
    private subscription: Subscription;
    private rows$ = new BehaviorSubject<FormGroup[]>([]);
    private _renderChangesSubscription: Subscription | null = null;

    constructor(
        @Inject(COLUMNS) private columns: KlesColumnConfig[],
        private fm: KlesForm,
        private rowFactory: RowFormFactory,
        private loaderService: LoaderService<any, any>,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
    ) {
        this.form = this.fm.form;

        columns.forEach((column) => {
            const { pipeTransform, ...tmpCell } = column.headerCell;
            let colCellHeader = _.cloneDeep(tmpCell);
            colCellHeader = { pipeTransform, ...colCellHeader };
            colCellHeader.name = column.columnDef;
            const control = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.fm.getHeader().addControl(column.columnDef, control);
        });

        this.fm
            .getHeader()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.filterStore?.setFilters(this.fm.getHeader().getRawValue());
            });

        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.rows$.next(this.fm.rows);
            });

        this.subscription = this.loaderService
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this._loading$.next(true);
                } else {
                    this._loading$.next(false);
                    this.fm.setRows(
                        this.rowFactory.createRows(
                            this.columns.map((col) => ({ ...col.cell, name: col.columnDef })),
                            response.items,
                        ),
                    );

                    console.log(this.fm.form);

                    this.setTotal(response.total || 0);

                    /**
                     * TODO afficher message d'erreur
                     */
                }
            });
    }

    get sort(): MatSort {
        return this._sort;
    }
    set sort(sort: MatSort) {
        this._sort = sort;

        this._sort.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            this.setSort(event.active, event.direction);
        });
    }

    get paginator(): MatPaginator {
        return this._paginator;
    }

    set paginator(paginator: MatPaginator) {
        this._paginator = paginator;

        this._renderChangesSubscription?.unsubscribe();
        this._renderChangesSubscription = this._paginator.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            this.setPage(event.pageIndex, event.pageSize);
        });
    }

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    setPage(page: number, perPage: number): void {
        this.paginatorStore?.setPage({ page, perPage });
        if (this._paginator) {
            this._paginator.pageIndex = page;
            this._paginator.pageSize = perPage;
        }
    }

    setTotal(total: number): void {
        if (this._paginator) {
            this._paginator.length = total;
        }
    }

    setSort(active: string, direction: SortDirection): void {
        this.sortStore?.setSort({ active, direction });
        this.setPage(0, this.paginatorStore?.snapshot().perPage);
    }

    setFilters(filters: { [key: string]: unknown }): void {
        this.filterStore?.setFilters(filters);
        this.setPage(0, this.paginatorStore?.snapshot().perPage);
    }

    refresh(): void {
        this.loaderService.refresh();
    }

    connect(): Observable<readonly FormGroup[]> {
        return this.rows$;
    }

    disconnect(): void {
        this._loading$.complete();
        this.subscription?.unsubscribe();
        this._renderChangesSubscription?.unsubscribe();
    }
}

export const KLES_DATA_SOURCE = new InjectionToken<IKlesDataSource>('KLES_DATA_SOURCE');
