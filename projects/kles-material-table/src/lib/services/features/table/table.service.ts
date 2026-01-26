import { DestroyRef, inject, Injectable, Optional, signal, Signal } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ColumnsService } from '../columns/columns.service';
import { RowFormFactory } from './row-factory.service';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { KlesDataSource, KlesLazyDataSource } from './datasource';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { MatPaginator } from '@angular/material/paginator';
import { PaginatorStore } from '../../store/paginator-store.service';
import { MatSort } from '@angular/material/sort';
import { FilterStore } from '../../store/filter-store.service';
import { SortStore } from '../../store/sort-store.service';
import { SortService } from '../sort/sort.service';
import { FilterService } from '../filter/filter.service';
import { auditTime, map, merge, startWith, switchMap } from 'rxjs';
import { KlesForm } from './form';
import { LoaderLazyService, LoaderService } from '../loader/loader.service';
import { KlesSelectionModel } from '../../../core/selection/selection-model';

export interface ITableService {
    readonly loading: Signal<boolean>;
    readonly form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;
    readonly dataSource: IKlesDataSource;
    readonly selectionModel: KlesSelectionModel<FormGroup>;

    get paginator(): MatPaginator | null | undefined;
    set paginator(paginator: MatPaginator | null | undefined);

    get sort(): MatSort | null | undefined;
    set sort(sort: MatSort | null | undefined);

    setPageIndex(index: number): void;
    setPageSize(size: number): void;
    firstPage(): void;
    lastPage(): void;

    refresh();
    trackBy: (_: number, row: FormGroup) => any;
}

@Injectable()
export class TableService implements ITableService {
    private _loading = signal(false);
    private readonly _destroyRef = inject(DestroyRef);
    private _dataSource: KlesDataSource;
    private _paginator: MatPaginator;
    private readonly destroyRef = inject(DestroyRef);

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    public loading = this._loading.asReadonly();
    public form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;

    selectionModel = new KlesSelectionModel<FormGroup>();

    constructor(
        private columnsService: ColumnsService,
        private fm: KlesForm,
        private rowFactory: RowFormFactory,
        private loaderService: LoaderService<any, any>,
        private scrollbarService: ScrollbarService,
        private sortService: SortService,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
        @Optional() private filterService: FilterService,
    ) {
        this.initDataSource();
        this.initColumns();
        this.form = this.fm.form;
        this.listenHeader();
        this.listenRows();
        this.load();
    }

    set paginator(paginator: MatPaginator) {
        this._paginator = paginator;
        this._dataSource.paginator = paginator;
        if (this._paginator) {
            this._paginator.pageIndex = this.paginatorStore?.snapshot().page;
            this._paginator.pageSize = this.paginatorStore?.snapshot().perPage;
            this._paginator.pageSizeOptions = this.paginatorStore?.pageSizeOptions;

            this._paginator.page.subscribe((event) => {
                this.paginatorStore?.setPage({ page: event.pageIndex, perPage: event.pageSize });
            });
        }
    }

    get paginator(): MatPaginator {
        return this._dataSource.paginator;
    }

    get sort(): MatSort {
        return this._dataSource.sort;
    }

    set sort(sort: MatSort) {
        this._dataSource.sort = sort;

        if (this.sort) {
            this.sort.active = this.sortStore?.snapshot()?.active;
            this.sort.direction = this.sortStore?.snapshot()?.direction;

            this.sort.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
                this.sortStore?.setSort(event);
            });
        }
    }

    get dataSource(): IKlesDataSource {
        return this._dataSource;
    }

    public setPageIndex(index: number) {
        if (this._paginator) {
            const prev = this._paginator.pageIndex;
            this._paginator.pageIndex = index;
            this._paginator.page.emit({
                pageIndex: this._paginator.pageIndex,
                pageSize: this._paginator.pageSize,
                length: this._paginator.length,
                previousPageIndex: prev,
            });
        }
    }

    public setPageSize(size: number) {
        if (this._paginator) {
            const prev = this._paginator.pageIndex;
            this._paginator.pageSize = size;
            this._paginator.pageIndex = 0;
            this._paginator.page.emit({
                pageIndex: this._paginator.pageIndex,
                pageSize: this._paginator.pageSize,
                length: this._paginator.length,
                previousPageIndex: prev,
            });
        }
    }

    public firstPage(): void {
        this._paginator.firstPage();
    }

    public lastPage(): void {
        this._paginator.lastPage();
    }

    public refresh() {
        this.loaderService.refresh();
    }

    private initColumns() {
        this.columnsService.columns().forEach((column) => {
            const { pipeTransform, ...tmpCell } = column.headerCell;
            let colCellHeader = _.cloneDeep(tmpCell);
            colCellHeader = { pipeTransform, ...colCellHeader };
            colCellHeader.name = column.columnDef;
            const control = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.fm.setHeader(colCellHeader.name, control, { emitEvent: false });
        });
    }

    private listenHeader() {
        this.fm
            .getHeader()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith())
            .subscribe(() => {
                this._dataSource.filter = JSON.stringify(this.filterService.prepareFilterData(this.fm.getHeader()));
                this.filterStore.setFilters(this.filterService.prepareFilterData(this.fm.getHeader()));
            });
    }

    private load() {
        this.loaderService
            .load()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this._loading.set(true);
                } else {
                    this._loading.set(false);
                    this.fm.setRows(
                        this.rowFactory.createRows(
                            this.columnsService.columns().map((col) => ({ ...col.cell, name: col.columnDef })),
                            response.items,
                        ),
                    );
                    /**
                     * TODO afficher message d'erreur
                     */
                }
            });
    }

    private initDataSource() {
        this._dataSource = new KlesDataSource();
        if (this.sortService) {
            this._dataSource.sortingDataAccessor = this.sortService.sortingDataAccessor;
            this._dataSource.sortData = this.sortService.sortData(this.columnsService.columns());
        }
        if (this.filterService) {
            this._dataSource.filterPredicate = this.filterService.createFilter(this.columnsService.columns());
            this._dataSource.filter = JSON.stringify(this.filterService.prepareFilterData(this.fm.getHeader()));
            this.filterStore.setFilters(this.filterService.prepareFilterData(this.fm.getHeader()));
        }

        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null))
            .subscribe(() => {
                this._dataSource.data = this.fm.rows;
            });
    }

    private listenRows(): void {
        this.dataSource
            .connect()
            .pipe(
                takeUntilDestroyed(this._destroyRef),
                auditTime(0),
                switchMap((rows) => {
                    return merge(
                        ...rows.map((row) => {
                            return row.valueChanges.pipe(map(() => row.getRawValue()));
                        }),
                    );
                }),
            )
            .subscribe((values) => console.log(values));
    }
}

@Injectable()
export class TableLazyService implements ITableService {
    private _loading = signal(false);
    private readonly _destroyRef = inject(DestroyRef);
    private _dataSource: KlesLazyDataSource;
    private _paginator: MatPaginator;
    private readonly destroyRef = inject(DestroyRef);

    public loading = this._loading.asReadonly();
    public form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;

    selectionModel = new KlesSelectionModel<FormGroup>();

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    constructor(
        private columnsService: ColumnsService,
        private fm: KlesForm,
        private rowFactory: RowFormFactory,
        private loaderService: LoaderLazyService<any, any>,
        private scrollbarService: ScrollbarService,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
    ) {
        this.initDataSource();
        this.initColumns();
        this.form = this.fm.form;
        this.listenHeader();
        this.listenRows();
        this.load();
    }

    get dataSource(): IKlesDataSource {
        return this._dataSource;
    }

    set paginator(paginator: MatPaginator) {
        this._paginator = paginator;
        this._dataSource.paginator = paginator;
        if (this._paginator) {
            this._paginator.pageIndex = this.paginatorStore?.snapshot().page;
            this._paginator.pageSize = this.paginatorStore?.snapshot().perPage;
            this._paginator.pageSizeOptions = this.paginatorStore?.pageSizeOptions;

            this._paginator.page.subscribe((event) => {
                this.paginatorStore.setPage({ page: event.pageIndex, perPage: event.pageSize });
            });
        }
    }

    get paginator(): MatPaginator {
        return this._paginator;
    }

    get sort(): MatSort {
        return this._dataSource.sort;
    }

    set sort(sort: MatSort) {
        this._dataSource.sort = sort;

        if (this.sort) {
            this.sort.active = this.sortStore?.snapshot()?.active;
            this.sort.direction = this.sortStore?.snapshot()?.direction;

            this.sort.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
                this.sortStore?.setSort(event);
            });
        }
    }

    public refresh() {
        this.loaderService.refresh();
    }

    public setPageIndex(index: number) {
        if (this._paginator) {
            this._paginator.pageIndex = index;
        }
    }

    public setPageSize(size: number) {
        if (this._paginator) {
            this._paginator.pageSize = size;
            this._paginator.firstPage();
        }
    }

    public firstPage(): void {
        this._paginator.firstPage();
    }

    public lastPage(): void {
        this._paginator.lastPage();
    }

    private initColumns() {
        this.columnsService.columns().forEach((column) => {
            const { pipeTransform, ...tmpCell } = column.headerCell;
            let colCellHeader = _.cloneDeep(tmpCell);
            colCellHeader = { pipeTransform, ...colCellHeader };
            colCellHeader.name = column.columnDef;
            const control = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.fm.setHeader(colCellHeader.name, control, { emitEvent: false });
        });
    }

    private listenHeader() {
        this.fm.getHeader().valueChanges.subscribe((value) => {});

        this.fm
            .getHeader()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith())
            .subscribe(() => {
                this.filterStore.setFilters(this.fm.getHeader().getRawValue());
            });
    }

    private load() {
        this.loaderService
            .load()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this._loading.set(true);
                } else {
                    this._loading.set(false);
                    this.fm.setRows(
                        this.rowFactory.createRows(
                            this.columnsService.columns().map((col) => ({ ...col.cell, name: col.columnDef })),
                            response.items,
                        ),
                    );
                    this._paginator.length = response.total ?? 0;

                    /**
                     * TODO afficher message d'erreur
                     */
                }
            });
    }

    private initDataSource() {
        this._dataSource = new KlesLazyDataSource();

        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null))
            .subscribe(() => {
                this._dataSource.data = this.fm.rows;
            });
    }

    private listenRows(): void {
        this.dataSource
            .connect()
            .pipe(
                takeUntilDestroyed(this._destroyRef),
                auditTime(0),
                switchMap((rows) => {
                    return merge(
                        ...rows.map((row) => {
                            return row.valueChanges.pipe(map(() => row.getRawValue()));
                        }),
                    );
                }),
            )
            .subscribe((values) => console.log(values));
    }
}
