import { Inject, Injectable, Optional } from '@angular/core';
import { PaginatorStore } from './store/paginator-store.service';
import { SortStore } from './store/sort-store.service';
import { FilterStore } from './store/filter-store.service';
import { auditTime, catchError, combineLatest, concat, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';
import { LOADER_CONFIG } from '../core/table/token';
import { LinesLazyLoader, LinesLoader } from '../core/table/loader.interface';
import { ILoader } from '../core/table/config.interface';

@Injectable()
export class LoaderService<T, R> {
    private refresh$ = new Subject<void>();

    constructor(
        @Inject(LOADER_CONFIG) private readonly loaderConfig: ILoader<T, R>,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
    ) {}

    public load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any }> {
        const lazy = this.loaderConfig.lazy || false;

        if (lazy) {
            const linesLoader = this.loaderConfig.lines as LinesLazyLoader<T, R>;
            return combineLatest([
                this.refresh$.pipe(startWith(void 0)),
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
        } else {
            const linesLoader = this.loaderConfig.lines as LinesLoader<T, R>;
            return combineLatest([this.refresh$.pipe(startWith(void 0)), this.loaderConfig.lines.params?.() || of({} as T)]).pipe(
                auditTime(0),
                switchMap(([_, params]) => {
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

    public refresh() {
        this.refresh$.next();
    }
}
