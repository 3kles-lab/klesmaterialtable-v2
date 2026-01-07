import { DataSource } from '@angular/cdk/table';
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, SortDirection } from '@angular/material/sort';
import { Observable } from 'rxjs';

export interface IKlesDataSource extends DataSource<FormGroup> {
    readonly loading$: Observable<boolean>;
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
