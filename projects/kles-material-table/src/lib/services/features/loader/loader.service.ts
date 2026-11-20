import { Inject, Injectable, Optional } from '@angular/core';
import { auditTime, catchError, combineLatest, concat, defer, filter, map, Observable, of, shareReplay, startWith, Subject, switchMap, tap, throwIfEmpty } from 'rxjs';
import { LOADER_CONFIG, PAGINATOR_CONFIG } from '../../../token';
import { PaginatorStore } from '../../store/paginator-store.service';
import { LoaderConfig, PaginatorConfig } from '../../../core/table/config.interface';
import { SortStore } from '../../store/sort-store.service';
import { FilterStore } from '../../store/filter-store.service';
import { LinesLazyLoader, LinesLoader } from '../../../core/table/loader.interface';
import { RefreshOptions } from '../../../core/api/table';
import { Query } from '../../../core/query/query.interface';
import { ILoader, LazyLoaderResponse, LoaderResponse } from './loader.interface';
import { EventsService } from '../events/events.service';

@Injectable()
export class LoaderService<T, R> implements ILoader<R> {
    private readonly _refresh$ = new Subject<RefreshOptions>();

    private _loader$!: Observable<LoaderResponse<R>>;

    constructor(
        @Inject(LOADER_CONFIG) private readonly loaderConfig: LoaderConfig<T, R>,
        private readonly eventsService: EventsService,
    ) {
        this.init();
    }

    private init() {
        const linesLoader = this.loaderConfig.lines as LinesLoader<T, R>;
        let previousRefresh: RefreshOptions | undefined;
        this._loader$ = combineLatest([this._refresh$.pipe(startWith(undefined)), linesLoader.params?.() || of({} as T)]).pipe(
            auditTime(0),
            switchMap(([refresh, params]) => {
                const showLoading = refresh === previousRefresh || refresh?.showLoading !== false;
                previousRefresh = refresh;
                return concat(
                    of({ loading: true, showLoading, total: 0, items: [] }),
                    defer(() => linesLoader.loader(params)).pipe(
                        throwIfEmpty(),
                        catchError((err) => {
                            return of({ error: err, items: [] });
                        }),
                        map((response) => {
                            return { ...response, loading: false, total: response?.items.length || 0 };
                        }),
                    ),
                );
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    public load(): Observable<LoaderResponse<R>> {
        return this._loader$;
    }

    public refresh(options?: RefreshOptions): void {
        this._refresh$.next({ ...options });
        this.eventsService.emit('refresh');
    }
}

@Injectable()
export class LoaderLazyService<T, R> implements ILoader<R> {
    private readonly _refresh$ = new Subject<RefreshOptions>();

    private _loader$!: Observable<LazyLoaderResponse<R>>;

    constructor(
        @Inject(LOADER_CONFIG) private readonly loaderConfig: LoaderConfig<T, R>,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
        private readonly eventsService: EventsService,
        @Optional() @Inject(PAGINATOR_CONFIG) private readonly paginatorConfig: PaginatorConfig | null = null,
    ) {
        this.init();
    }

    public load(): Observable<LazyLoaderResponse<R>> {
        return this._loader$;
    }

    private init() {
        const linesLoader = this.loaderConfig.lines as LinesLazyLoader<T, R>;
        const requests$ = combineLatest([
            this._refresh$.pipe(startWith(undefined)),
            linesLoader.params?.() || of({} as T),
            this.paginatorStore?.pageRequests$ || of(undefined),
            this.sortStore?.sort$ || of(undefined),
            this.filterStore?.filters$ || of({}),
        ]);
        let previousRefresh: RefreshOptions | undefined;
        let requestVersion = 0;
        this._loader$ = requests$.pipe(
            tap(() => requestVersion++),
            auditTime(0),
            switchMap(([refresh, params, , sort, filters]) => {
                const version = requestVersion;
                const showLoading = refresh === previousRefresh || refresh?.showLoading !== false;
                previousRefresh = refresh;
                const query = { filters, pagination: this.paginatorStore?.snapshot(), sort };
                return concat(
                    of({ loading: true, showLoading, total: 0, items: [] }),
                    this.loadPage(linesLoader, params, query).pipe(
                        throwIfEmpty(),
                        catchError((error: unknown) => of({ error, items: [] as R[], total: 0, loading: false })),
                        filter(() => version === requestVersion),
                    ),
                );
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    private loadPage(linesLoader: LinesLazyLoader<T, R>, params: T, query: Query): Observable<LazyLoaderResponse<R>> {
        return defer(() => linesLoader.loader(params, query)).pipe(
            switchMap((response) => {
                const pagination = query.pagination;
                if (this.paginatorConfig?.paginator && pagination && pagination.perPage > 0) {
                    const lastPage = Math.max(0, Math.ceil(response.total / pagination.perPage) - 1);
                    if (pagination.page > lastPage) {
                        return this.loadPage(linesLoader, params, { ...query, pagination: { ...pagination, page: lastPage } });
                    }
                }
                return of({ ...response, loading: false, pagination });
            }),
        );
    }

    public refresh(options?: RefreshOptions): void {
        this._refresh$.next({ ...options });
        this.eventsService.emit('refresh');
    }
}
