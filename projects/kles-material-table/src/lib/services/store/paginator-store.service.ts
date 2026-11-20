import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { Pagination } from '../../core/query/query.interface';
import { ITableStore } from './store';
import { PAGINATOR_CONFIG } from '../../token';
import { PaginatorConfig } from '../../core/table/config.interface';

interface PageState {
    pagination: Pagination;
    requestPage: boolean;
}

@Injectable()
export class PaginatorStore implements ITableStore {
    private readonly state: BehaviorSubject<PageState>;
    readonly page$: Observable<Pagination>;
    readonly pageRequests$: Observable<Pagination>;

    constructor(@Optional() @Inject(PAGINATOR_CONFIG) protected config: PaginatorConfig) {
        this.state = new BehaviorSubject<PageState>({ pagination: { page: 0, perPage: config?.pageSize ?? 10 }, requestPage: true });
        this.page$ = this.state.pipe(map(({ pagination }) => pagination));
        this.pageRequests$ = this.state.pipe(
            filter(({ requestPage }, index) => requestPage || index === 0),
            map(({ pagination }) => pagination),
        );
    }

    setPage(pagination: Pagination, requestPage = true) {
        this.state.next({ pagination, requestPage });
    }

    snapshot() {
        return this.state.value.pagination;
    }

    reset(): void {
        this.setPage({ page: 0, perPage: this.config?.pageSize ?? 10 });
    }
}
