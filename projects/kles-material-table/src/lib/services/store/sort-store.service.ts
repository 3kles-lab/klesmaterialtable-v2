import { Injectable } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { BehaviorSubject } from 'rxjs';
import { ITableStore } from './store';

@Injectable()
export class SortStore implements ITableStore {
    private s = new BehaviorSubject<Sort | undefined>(undefined);
    sort$ = this.s.asObservable();

    setSort(v?: Sort) {
        this.s.next(v);
    }

    reset(): void {
        this.s.next(undefined);
    }
}
