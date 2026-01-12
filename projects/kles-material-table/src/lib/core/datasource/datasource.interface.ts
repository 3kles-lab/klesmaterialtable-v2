import { DataSource } from '@angular/cdk/table';
import { Signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';

interface ICrudDataSource {
    addRecord(record: any, options?: { index?: number; emitEvent?: boolean }): FormGroup;
    removeById(id: string, options?: { emitEvent?: boolean }): boolean;
    removeAt(index: number, options?: { emitEvent?: boolean }): boolean;
    updateRecord(id: string, record: any, options?: { emitEvent?: boolean }): FormGroup;
    clearRows(options?: { emitEvent?: boolean }): void;
}

interface IColumn {
    changeColumnVisibility(columnDef: string, visible: boolean): void;
    toggleColumnVisibility(columnDef: string): void;
}

interface IHelperDataSource {
    // getRowById(id: string): FormGroup | null;
    // getRowAt(index: number): FormGroup | null;
}

interface IDataSource extends DataSource<FormGroup> {
    readonly loading: Signal<boolean>;
    readonly form: FormGroup;

    get paginator(): MatPaginator | null | undefined;
    set paginator(paginator: MatPaginator | null | undefined);

    get sort(): MatSort | null | undefined;
    set sort(sort: MatSort | null | undefined);

    trackBy(_: number, row: FormGroup): any;
    refresh(): void;
    setPage(page: number, perPage: number): void;
    setSort(active: string, direction: SortDirection): void;
    setFilters(filters: { [key: string]: any }): void;
}

export type IKlesDataSource = IDataSource & IHelperDataSource & ICrudDataSource & IColumn;
