import { Injectable } from '@angular/core';
import { ITableStore } from './store';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class ExpandedRowStore implements ITableStore {
    private readonly _expandedIds$ = new BehaviorSubject<Set<string>>(new Set());

    public readonly expandedIds$ = this._expandedIds$.asObservable();

    public reset(): void {
        this._expandedIds$.next(new Set());
    }

    public isExpanded(id: string): boolean {
        return this._expandedIds$.value.has(id);
    }

    public get expandedIds(): ReadonlySet<string> {
        return this._expandedIds$.value;
    }

    expand(id: string): void {
        const next = new Set(this._expandedIds$.value);
        next.add(id);
        this._expandedIds$.next(next);
    }

    collapse(id: string): void {
        const next = new Set(this._expandedIds$.value);
        next.delete(id);
        this._expandedIds$.next(next);
    }

    toggle(id: string): void {
        const next = new Set(this._expandedIds$.value);
        next.has(id) ? next.delete(id) : next.add(id);
        this._expandedIds$.next(next);
    }
}
