import { DestroyRef, Inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { auditTime, filter, fromEvent, skip } from 'rxjs';
import { InfiniteScrollConfig, LoaderConfig } from '../../../core/table/config.interface';
import { EventsService } from '../events/events.service';
import { ILoader } from '../loader/loader.interface';
import { KlesForm } from '../table/form';
import { FilterStore } from '../../store/filter-store.service';
import { PaginatorStore } from '../../store/paginator-store.service';
import { SortStore } from '../../store/sort-store.service';
import { INFINITE_SCROLL_CONFIG, LINES_SERVICE, LOADER_CONFIG, LOADER_SERVICE } from '../../../token';
import { ILinesService } from '../lines/lines.service';
import { ScrollbarService } from './scrollbar.service';

@Injectable()
export class InfiniteScrollService {
    private element?: HTMLElement;
    private registered = false;
    private loading = false;
    private lastLoadedPage = 0;
    private readonly _loadingMore = signal(false);

    readonly loadingMore: Signal<boolean> = this._loadingMore.asReadonly();

    constructor(
        @Inject(INFINITE_SCROLL_CONFIG) private readonly config: InfiniteScrollConfig,
        @Inject(LOADER_CONFIG) private readonly loaderConfig: LoaderConfig<unknown, unknown>,
        @Inject(LOADER_SERVICE) private readonly loader: ILoader<unknown>,
        @Inject(LINES_SERVICE) private readonly linesService: ILinesService,
        private readonly paginatorStore: PaginatorStore,
        private readonly sortStore: SortStore,
        private readonly filterStore: FilterStore,
        private readonly form: KlesForm,
        private readonly scrollbarService: ScrollbarService,
        private readonly eventsService: EventsService,
        private readonly destroyRef: DestroyRef,
    ) {}

    register(element: HTMLElement): void {
        this.element = element;

        if (this.registered) return;
        this.registered = true;

        fromEvent(element, 'scroll', { passive: true })
            .pipe(auditTime(this.config.scrollDebounceTime ?? 100), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.loadNextPageIfNeeded());

        this.loader
            .load()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
                this.loading = response.loading;
                if (!response.loading) {
                    this._loadingMore.set(false);
                    if (!response.error) {
                        this.lastLoadedPage = this.paginatorStore.snapshot().page;
                        this.checkViewportAfterRender();
                    }
                }
            });

        this.sortStore.sort$.pipe(skip(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reset());
        this.filterStore.filters$.pipe(skip(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reset());
        this.eventsService.events$
            .pipe(
                filter((event) => event.type === 'refresh'),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => this.reset());

        const params$ = this.loaderConfig.lines.params?.();
        params$?.pipe(skip(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reset());
    }

    private loadNextPageIfNeeded(): void {
        const element = this.element;
        if (!element || this.loading || this._loadingMore()) return;

        const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
        if (remaining > (this.config.scrollThreshold ?? 200)) return;

        const loadedRows = this.form.getRows().length;
        const total = this.linesService.total();
        if (total === 0 || loadedRows >= total) return;

        const previousPage = this.lastLoadedPage;
        const pageSize = this.paginatorStore.snapshot().perPage;
        const pageIndex = previousPage + 1;

        this._loadingMore.set(true);
        this.paginatorStore.setPage({ page: pageIndex, perPage: pageSize });
        this.eventsService.emit('pageChange', {
            pageIndex,
            previousPageIndex: previousPage,
            pageSize,
            totalItems: total,
        });
    }

    private reset(): void {
        const pagination = this.paginatorStore.snapshot();
        this.lastLoadedPage = 0;
        this._loadingMore.set(false);
        this.scrollbarService.toTop('instant');

        if (pagination.page !== 0) {
            this.paginatorStore.setPage({ page: 0, perPage: pagination.perPage });
        }
    }

    private checkViewportAfterRender(): void {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => this.loadNextPageIfNeeded());
        }
    }
}
