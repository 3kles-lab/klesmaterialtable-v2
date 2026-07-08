import { Inject, Injectable, Optional } from '@angular/core';
import { auditTime, catchError, combineLatest, concat, map, Observable, of, ReplaySubject, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import { LOADER_CONFIG } from '../../../token';
import { PaginatorStore } from '../../store/paginator-store.service';
import { LoaderConfig } from '../../../core/table/config.interface';
import { SortStore } from '../../store/sort-store.service';
import { FilterStore } from '../../store/filter-store.service';
import { LinesLazyLoader, LinesLoader } from '../../../core/table/loader.interface';
import { ILoader } from './loader.interface';
import { EventsService } from '../events/events.service';

@Injectable()
export class LoaderService<T, R> implements ILoader<R> {
    private _refresh$ = new Subject<void>();

    private _loader$!: Observable<{ total: number; items: R[]; loading: boolean; error?: any; header?: any }>;

    constructor(
        @Inject(LOADER_CONFIG) private readonly loaderConfig: LoaderConfig<T, R>,
        private readonly eventsService: EventsService,
    ) {
        this.init();
    }

    private init() {
        const linesLoader = this.loaderConfig.lines as LinesLoader<T, R>;
        this._loader$ = combineLatest([this._refresh$.pipe(startWith(void 0)), this.loaderConfig.lines.params?.() || of({} as T)]).pipe(
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
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    public load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any }> {
        return this._loader$;
    }

    public refresh() {
        this._refresh$.next();
        this.eventsService.emit('refresh');
    }
}

@Injectable()
export class LoaderLazyService<T, R> implements ILoader<R> {
    private _refresh$ = new Subject<void>();

    private _loader$!: Observable<{ total: number; items: R[]; loading: boolean; error?: any; header?: any }>;

    constructor(
        @Inject(LOADER_CONFIG) private readonly loaderConfig: LoaderConfig<T, R>,
        @Optional() private paginatorStore: PaginatorStore | null,
        @Optional() private sortStore: SortStore | null,
        @Optional() private filterStore: FilterStore | null,
        private readonly eventsService: EventsService,
    ) {
        this.init();
    }

    public load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any }> {
        return this._loader$;
    }

    private init() {
        const linesLoader = this.loaderConfig.lines as LinesLazyLoader<T, R>;
        this._loader$ = combineLatest([
            this._refresh$.pipe(startWith(void 0)),
            this.loaderConfig.lines.params?.() || of({} as T),
            this.paginatorStore?.page$ || of(undefined),
            this.sortStore?.sort$ || of(undefined),
            this.filterStore?.filters$ || of({}),
        ]).pipe(
            auditTime(0),
            switchMap(([_, params, pagination, sort, filters]) => {
                return concat(
                    of({ loading: true, total: 0, items: [] }),
                    linesLoader.loader(params, { filters, pagination, sort }).pipe(
                        catchError((err) => {
                            return of({ error: err, items: [] as R[], total: 0 });
                        }),
                        map((response) => {
                            return { ...response, loading: false };
                        }),
                    ),
                );
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    public refresh() {
        this._refresh$.next();
        this.eventsService.emit('refresh');
    }
}
