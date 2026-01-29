import { KlesSelectionModel } from '@3kles/kles-material-dynamicforms';
import { Injectable, Optional } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { SortStore } from '../../store/sort-store.service';
import { ColumnsService } from '../columns/columns.service';
import { FilterService } from '../filter/filter.service';
import { LoaderLazyService, LoaderService } from '../loader/loader.service';
import { ScrollbarService } from '../scrollbar/scrollbar.service';
import { SortService } from '../sort/sort.service';
import { AbstractTableService } from './abstract-table.service';
import { KlesDataSource, KlesLazyDataSource } from './datasource';
import { KlesForm } from './form';
import { RowFormFactory } from './row-factory.service';

@Injectable()
export class TableService extends AbstractTableService<KlesDataSource> {
    selectionModel = new KlesSelectionModel<FormGroup>();

    constructor(
        columnsService: ColumnsService,
        fm: KlesForm,
        rowFactory: RowFormFactory,
        loader: LoaderService<any, any>,
        scrollbarService: ScrollbarService,
        private sortService: SortService,
        @Optional() paginatorStore: PaginatorStore | null,
        @Optional() sortStore: SortStore | null,
        @Optional() filterStore: FilterStore | null,
        @Optional() private filterService: FilterService,
    ) {
        super(columnsService, fm, rowFactory, loader, scrollbarService, paginatorStore, sortStore, filterStore);
    }

    protected createDataSource() {
        return new KlesDataSource();
    }

    protected configureDataSource(ds: KlesDataSource) {
        if (this.sortService) {
            ds.sortingDataAccessor = this.sortService.sortingDataAccessor;
            ds.sortData = this.sortService.sortData(this.columnsService.columns());
        }

        if (this.filterService) {
            ds.filterPredicate = this.filterService.createFilter(this.columnsService.columns());
            ds.filter = JSON.stringify(this.filterService.prepareFilterData(this.fm.getHeader()));
            this.filterStore?.setFilters(this.filterService.prepareFilterData(this.fm.getHeader()));
        }
    }

    protected onHeaderChanged(): void {
        if (!this.filterService) return;
        const prepared = this.filterService.prepareFilterData(this.fm.getHeader());
        this._dataSource.filter = JSON.stringify(prepared);
        this.filterStore?.setFilters(prepared);
    }

    setPageIndex(index: number) {
        const p = this._paginator;
        if (!p) {
            return;
        }
        const prev = p.pageIndex;
        p.pageIndex = index;
        p.page.emit({ pageIndex: p.pageIndex, pageSize: p.pageSize, length: p.length, previousPageIndex: prev });
    }

    setPageSize(size: number) {
        const p = this._paginator;
        if (!p) {
            return;
        }
        const prev = p.pageIndex;
        p.pageSize = size;
        p.pageIndex = 0;
        p.page.emit({ pageIndex: p.pageIndex, pageSize: p.pageSize, length: p.length, previousPageIndex: prev });
    }
}

@Injectable()
export class TableLazyService extends AbstractTableService<KlesLazyDataSource> {
    constructor(
        columnsService: ColumnsService,
        fm: KlesForm,
        rowFactory: RowFormFactory,
        loader: LoaderLazyService<any, any>,
        scrollbarService: ScrollbarService,
        @Optional() paginatorStore: PaginatorStore | null,
        @Optional() sortStore: SortStore | null,
        @Optional() filterStore: FilterStore | null,
    ) {
        super(columnsService, fm, rowFactory, loader, scrollbarService, paginatorStore, sortStore, filterStore);
    }

    protected createDataSource() {
        return new KlesLazyDataSource();
    }

    protected configureDataSource(_ds: KlesLazyDataSource) {}

    protected onHeaderChanged(): void {
        this.filterStore?.setFilters(this.fm.getHeader().getRawValue());
    }

    protected afterLoad(response: { total?: number }) {
        if (this._paginator) {
            this._paginator.length = response.total ?? 0;
        }
    }

    setPageIndex(index: number) {
        if (!this._paginator) {
            return;
        }
        this._paginator.pageIndex = index;
    }

    setPageSize(size: number) {
        if (!this._paginator) {
            return;
        }
        this._paginator.pageSize = size;
        this._paginator.firstPage();
    }
}
