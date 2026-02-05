import { Inject, Injectable, Optional } from '@angular/core';
import { auditTime, catchError, combineLatest, concat, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { LOADER_CONFIG } from '../../../token';
import { PaginatorStore } from '../../store/paginator-store.service';
import { ILoaderConfig } from '../../../core/table/config.interface';
import { SortStore } from '../../store/sort-store.service';
import { FilterStore } from '../../store/filter-store.service';
import { LinesLazyLoader, LinesLoader } from '../../../core/table/loader.interface';

export interface ILinesLoader<R> {
    load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any }>;

}

@Injectable()
export class LinesLoaderService<T, R> implements ILinesLoader<R> {
    private _refresh$ = new Subject<void>();

    constructor(@Inject(LOADER_CONFIG) private readonly loaderConfig: ILoaderConfig<T, R>) {}

    public load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any }> {
        const linesLoader = this.loaderConfig.lines as LinesLoader<T, R>;
        return combineLatest([ this.loaderConfig.lines.params?.() || of({} as T)]).pipe(
            auditTime(0),
            switchMap(([ params]) => {
                return concat(
                    of({ loading: true, total: 0, items: [] }),
                    linesLoader.loader(params).pipe(
                        catchError((err) => {
                            return of({ error: err, items: [] });
                        }),
                        map((response) => {
                            return { ...response, loading: false, total: response?.items.length || 0 };
                        }),
                    ),
                );
            }),
        );
    }

  
}

@Injectable()
export class LinesLoaderLazyService<T, R> implements ILinesLoader<R> {
    private _refresh$ = new Subject<void>();

    constructor(
        @Inject(LOADER_CONFIG) private readonly loaderConfig: ILoaderConfig<T, R>,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
    ) {}

    public load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any }> {
        const linesLoader = this.loaderConfig.lines as LinesLazyLoader<T, R>;
        return combineLatest([
            this._refresh$.pipe(startWith(void 0)),
            this.loaderConfig.lines.params?.() || of({} as T),
            this.paginatorStore?.page$ || of(null),
            this.sortStore?.sort$ || of(null),
            this.filterStore?.filters$ || of({}),
        ]).pipe(
            auditTime(0),
            switchMap(([_, params, pagination, sort, filters]) => {
                return concat(
                    of({ loading: true, total: 0, items: [] }),
                    linesLoader.loader(params, { filters, pagination, sort }).pipe(
                        catchError((err) => {
                            return of({ error: err, items: [], total: 0 });
                        }),
                        map((response) => {
                            return { ...response, loading: false };
                        }),
                    ),
                );
            }),
        );
    }
}
