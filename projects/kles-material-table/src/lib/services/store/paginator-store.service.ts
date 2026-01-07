import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Pagination } from '../../core/query/query.interface';
import { ITableStore } from './store';

@Injectable()
export class PaginatorStore implements ITableStore {
    private s = new BehaviorSubject<Pagination>({ page: 0, perPage: 25 });
    page$ = this.s.asObservable();

    setPage(v: Pagination) {
        this.s.next(v);
    }
    
    snapshot() {
        return this.s.value;
    }

    reset(): void {
        this.s.next({ page: 0, perPage: 25 });
    }
}
