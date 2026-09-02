import { Inject, Injectable, Optional } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { BehaviorSubject, Observable } from 'rxjs';
import { ITableStore } from './store';
import { SORT_CONFIG } from '../../token';

@Injectable()
export class SortStore implements ITableStore {
    private s: BehaviorSubject<Sort | undefined>;
    sort$: Observable<Sort | undefined>;

    constructor(@Optional() @Inject(SORT_CONFIG) protected config: Sort) {
        this.s = new BehaviorSubject<Sort | undefined>(config || undefined);
        this.sort$ = this.s.asObservable();
    }

    setSort(v?: Sort) {
        this.s.next(v);
    }

    snapshot() {
        return this.s.value;
    }

    reset(): void {
        this.s.next(this.config || undefined);
    }
}
