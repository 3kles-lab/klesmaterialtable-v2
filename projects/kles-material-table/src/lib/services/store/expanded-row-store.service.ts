import { Inject, Injectable } from '@angular/core';
import { ITableStore } from './store';
import { BehaviorSubject } from 'rxjs';
import { MULTI_UNFOLD } from '../../token';

export type ExpandedRowId = string | number;

@Injectable()
export class ExpandedRowStore implements ITableStore {
    private readonly _expandedIds$ = new BehaviorSubject<Set<ExpandedRowId>>(new Set());

    public readonly expandedIds$ = this._expandedIds$.asObservable();

    constructor(@Inject(MULTI_UNFOLD) private readonly multiUnfold = false) {}

    public reset(): void {
        this._expandedIds$.next(new Set());
    }

    public isExpanded(id: ExpandedRowId): boolean {
        return this._expandedIds$.value.has(id);
    }

    public get expandedIds(): ReadonlySet<ExpandedRowId> {
        return this._expandedIds$.value;
    }

    expand(id: ExpandedRowId): void {
        const next = this.multiUnfold ? new Set(this._expandedIds$.value) : new Set<ExpandedRowId>();
        next.add(id);
        this._expandedIds$.next(next);
    }

    collapse(id: ExpandedRowId): void {
        const next = new Set(this._expandedIds$.value);
        next.delete(id);
        this._expandedIds$.next(next);
    }

    toggle(id: ExpandedRowId): void {
        if (this.isExpanded(id)) {
            this.collapse(id);
        } else {
            this.expand(id);
        }
    }
}
