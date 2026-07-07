import { MatTableDataSource } from '@angular/material/table';
import { IKlesDataSource } from '../../../core/datasource/datasource.interface';
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, Observable } from 'rxjs';

export class KlesDataSource extends MatTableDataSource<FormGroup, MatPaginator> implements IKlesDataSource {
    constructor() {
        super([]);
    }
}

export class KlesLazyDataSource implements IKlesDataSource {
    private _paginator: MatPaginator | undefined;
    private _sort: MatSort | undefined;
    private _rows$ = new BehaviorSubject<FormGroup[]>([]);
    private _filter: string | undefined = undefined;

    get sort(): MatSort | undefined {
        return this._sort;
    }

    set sort(sort: MatSort) {
        this._sort = sort;
    }

    get paginator(): MatPaginator | undefined {
        return this._paginator;
    }

    set paginator(paginator: MatPaginator) {
        this._paginator = paginator;
    }

    set data(data: any[]) {
        this._rows$.next(data);
    }

    get filter(): string | undefined{
        return this._filter;
    }
    set filter(f: string) {
        this._filter = f;
    }

    connect(): Observable<FormGroup[]> {
        return this._rows$;
    }

    disconnect(): void {
        this._rows$.complete();
    }
}
