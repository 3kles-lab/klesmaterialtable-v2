import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ITableStore } from './store';

@Injectable()
export class FilterStore implements ITableStore {
    private s = new BehaviorSubject<Record<string, unknown>>({});
    filters$ = this.s.asObservable();

    setFilters(v: Record<string, unknown>) {
        this.s.next(v);
    }

    reset(): void {
        this.s.next({});
    }
}
