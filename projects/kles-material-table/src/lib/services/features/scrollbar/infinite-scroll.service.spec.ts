import { DestroyRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReplaySubject, skip } from 'rxjs';
import { InfiniteScrollConfig, LoaderConfig } from '../../../core/table/config.interface';
import { EventsService } from '../events/events.service';
import { ILoader } from '../loader/loader.interface';
import { ILinesService } from '../lines/lines.service';
import { KlesForm } from '../table/form';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { SortStore } from '../../store/sort-store.service';
import { InfiniteScrollService } from './infinite-scroll.service';
import { ScrollbarService } from './scrollbar.service';

describe('InfiniteScrollService', () => {
    let responses$: ReplaySubject<any>;
    let paginatorStore: PaginatorStore;
    let sortStore: SortStore;
    let eventsService: EventsService;
    let element: HTMLElement;
    let loadedRows: number;
    let total: number;
    let service: InfiniteScrollService;

    beforeEach(() => {
        responses$ = new ReplaySubject<any>(1);
        paginatorStore = new PaginatorStore({ pageSize: 10 });
        sortStore = new SortStore(undefined as any);
        eventsService = new EventsService();
        loadedRows = 10;
        total = 100;

        const loader = {
            load: () => responses$.asObservable(),
            refresh: () => undefined,
        } as ILoader<unknown>;
        const linesService = {
            total: () => total,
        } as ILinesService;
        const form = {
            getRows: () => ({ length: loadedRows }),
        } as unknown as KlesForm;
        const scrollbarService = jasmine.createSpyObj<ScrollbarService>('ScrollbarService', ['toTop']);
        const destroyRef = {
            destroyed: false,
            onDestroy: (_callback: () => void) => () => undefined,
        } as DestroyRef;
        const config: InfiniteScrollConfig = {
            infinite: true,
            pageSize: 10,
            scrollThreshold: 100,
            scrollDebounceTime: 0,
        };
        const loaderConfig = {
            lazy: true,
            lines: {},
        } as LoaderConfig<unknown, unknown>;

        service = new InfiniteScrollService(
            config,
            loaderConfig,
            loader,
            linesService,
            paginatorStore,
            sortStore,
            new FilterStore(),
            form,
            scrollbarService,
            eventsService,
            destroyRef,
        );

        element = document.createElement('div');
        Object.defineProperties(element, {
            scrollHeight: { configurable: true, value: 1000 },
            clientHeight: { configurable: true, value: 500 },
            scrollTop: { configurable: true, writable: true, value: 450 },
        });
        service.register(element);
    });

    it('requests the next page near the bottom', fakeAsync(() => {
        element.dispatchEvent(new Event('scroll'));
        tick(1);

        expect(paginatorStore.snapshot()).toEqual({ page: 1, perPage: 10 });
        expect(service.loadingMore()).toBeTrue();
    }));

    it('stops requesting pages once every row is loaded', fakeAsync(() => {
        loadedRows = total;
        element.dispatchEvent(new Event('scroll'));
        tick(1);

        expect(paginatorStore.snapshot().page).toBe(0);
    }));

    it('retries the failed page instead of skipping it', fakeAsync(() => {
        const requestedPages: number[] = [];
        paginatorStore.page$.pipe(skip(1)).subscribe(({ page }) => requestedPages.push(page));

        element.dispatchEvent(new Event('scroll'));
        tick(1);
        responses$.next({ loading: true, total: 0, items: [] });
        responses$.next({ loading: false, total: 0, items: [], error: new Error('failed') });

        element.dispatchEvent(new Event('scroll'));
        tick(1);

        expect(requestedPages).toEqual([1, 1]);
    }));

    it('returns to the first page when sorting changes', fakeAsync(() => {
        element.dispatchEvent(new Event('scroll'));
        tick(1);

        sortStore.setSort({ active: 'name', direction: 'asc' });

        expect(paginatorStore.snapshot()).toEqual({ page: 0, perPage: 10 });
    }));
});
