import { DestroyRef, inject, Injectable, Optional, signal, Signal } from '@angular/core';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { FormArray, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as _ from 'lodash';
import { auditTime, switchMap, merge, map, startWith } from 'rxjs';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { SortStore } from '../../store/sort-store.service';
import { ColumnsService } from '../columns/columns.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { KlesForm } from './form';
import { RowFormFactory } from './row-factory.service';
import { ILoader } from '../loader/loader.service';

export interface ITableService {
    readonly loading: Signal<boolean>;
    readonly form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;
    readonly dataSource: IKlesDataSource;

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
export abstract class AbstractTableService<TDs extends IKlesDataSource> implements ITableService {
    protected _loading = signal(false);
    public readonly loading = this._loading.asReadonly();

    protected readonly destroyRef = inject(DestroyRef);

    protected _dataSource!: TDs;
    protected _paginator?: MatPaginator;

    public form: FormGroup<{
        header: FormGroup<{}>;
        rows: FormArray<FormGroup<any>>;
        footer: FormGroup<{}>;
    }>;

    trackBy = (_: number, row: FormGroup) => row.get('_id')?.value ?? row;

    constructor(
        protected columnsService: ColumnsService,
        protected fm: KlesForm,
        protected rowFactory: RowFormFactory,
        protected loader: ILoader<any>,
        protected scrollbarService: ScrollbarService,
        @Optional() protected paginatorStore: PaginatorStore | null,
        @Optional() protected sortStore: SortStore | null,
        @Optional() protected filterStore: FilterStore | null,
    ) {
        this.form = this.fm.form;

        this.initDataSource(); // hook
        this.initColumns(); // commun
        this.listenHeader(); // hook
        this.listenRows(); // commun
        this.load(); // hook via afterLoad()
    }

    // --------- ITableService ---------
    get dataSource(): IKlesDataSource {
        return this._dataSource;
    }

    get paginator(): MatPaginator | null | undefined {
        return this._paginator;
    }

    set paginator(p: MatPaginator | null | undefined) {
        if (!p) {
            return;
        }
        this._paginator = p;
        this._dataSource.paginator = p;

        p.pageIndex = this.paginatorStore?.snapshot().page ?? p.pageIndex;
        p.pageSize = this.paginatorStore?.snapshot().perPage ?? p.pageSize;
        p.pageSizeOptions = this.paginatorStore?.pageSizeOptions ?? p.pageSizeOptions;

        p.page.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            this.paginatorStore?.setPage({ page: event.pageIndex, perPage: event.pageSize });
            this.onPaginatorChanged(event); // hook
        });
    }

    get sort(): MatSort | null | undefined {
        return this._dataSource.sort;
    }

    set sort(s: MatSort | null | undefined) {
        if (!s) return;
        this._dataSource.sort = s;

        s.active = this.sortStore?.snapshot()?.active ?? s.active;
        s.direction = this.sortStore?.snapshot()?.direction ?? s.direction;

        s.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            this.sortStore?.setSort(event);
            this.onSortChanged(event); // hook
        });
    }

    refresh() {
        this.loader.refresh();
    }

    firstPage() {
        this._paginator?.firstPage();
    }
    lastPage() {
        this._paginator?.lastPage();
    }

    abstract setPageIndex(index: number): void;
    abstract setPageSize(size: number): void;

    // --------- commun ---------
    protected initColumns() {
        this.columnsService.columns().forEach((column) => {
            const { pipeTransform, ...tmpCell } = column.headerCell;
            let colCellHeader = _.cloneDeep(tmpCell);
            colCellHeader = { pipeTransform, ...colCellHeader };
            colCellHeader.name = column.columnDef;

            const control = this.rowFactory.createControl(colCellHeader, colCellHeader.value);
            this.fm.setHeader(colCellHeader.name, control, { emitEvent: false });
        });
    }

    protected listenRows(): void {
        this._dataSource
            .connect()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                auditTime(0),
                switchMap((rows) => merge(...rows.map((row) => row.valueChanges.pipe(map(() => row.getRawValue()))))),
            )
            .subscribe((values) => console.log(values));
    }

    protected load() {
        this.loader
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                if (response.loading) {
                    this.scrollbarService.toTop('instant');
                    this._loading.set(true);
                    return;
                }

                this._loading.set(false);

                this.fm.setRows(
                    this.rowFactory.createRows(
                        this.columnsService.columns().map((col) => ({ ...col.cell, name: col.columnDef })),
                        response.items,
                    ),
                );

                this.afterLoad(response); // hook
            });
    }

    protected abstract createDataSource(): TDs;

    protected initDataSource() {
        this._dataSource = this.createDataSource();

        this.fm
            .getRows()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null))
            .subscribe(() => {
                this._dataSource.data = this.fm.rows;
            });

        this.configureDataSource(this._dataSource);
    }

    protected abstract configureDataSource(ds: TDs): void;

    protected listenHeader() {
        this.fm
            .getHeader()
            .valueChanges.pipe(takeUntilDestroyed(this.destroyRef), startWith(null))
            .subscribe(() => this.onHeaderChanged());
    }

    protected abstract onHeaderChanged(): void;

    protected afterLoad(_response: { total?: number }) {}
    protected onPaginatorChanged(_event: PageEvent) {}
    protected onSortChanged(_event: Sort) {}
}
