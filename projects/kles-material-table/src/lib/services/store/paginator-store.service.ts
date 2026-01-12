import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Pagination } from '../../core/query/query.interface';
import { ITableStore } from './store';
import { PAGINATOR_CONFIG } from '../../token';
import { IPaginatorConfig } from '../../core/table/config.interface';

@Injectable()
export class PaginatorStore implements ITableStore {
    private s: BehaviorSubject<Pagination>;
    public page$: Observable<Pagination>;

    public pageSizeOptions: number[];

    constructor(@Optional() @Inject(PAGINATOR_CONFIG) protected config: IPaginatorConfig) {
        this.pageSizeOptions = config?.pageSizeOptions ?? [5, 10, 20, 25, 50];
        this.s = new BehaviorSubject<Pagination>({ page: 0, perPage: config?.pageSize ?? 10 });
        this.page$ = this.s.asObservable();
    }

    setPage(v: Pagination) {
        this.s.next(v);
    }

    snapshot() {
        return this.s.value;
    }

    reset(): void {
        this.s.next({ page: 0, perPage: this.config?.pageSize ?? 10 });
    }
}
