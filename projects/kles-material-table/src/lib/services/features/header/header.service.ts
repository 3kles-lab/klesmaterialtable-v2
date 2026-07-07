import { DestroyRef, Inject, inject, Injectable, Optional } from '@angular/core';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, merge, pairwise, scan, startWith, switchMap } from 'rxjs';
import { FilterService } from '../filter/filter.service';
import { FilterStore } from '../../store/filter-store.service';
import { DATASOURCE_SERVICE, LOADER_SERVICE } from '../../../token';
import { IDatasourceService } from '../datasource/datasource.service';
import { ColumnsService } from '../columns/columns.service';
import { ILoader } from '../loader/loader.interface';
import { EventsService } from '../events/events.service';
import _ from 'lodash';

export interface IHeaderService {
    register(): void;
}

@Injectable()
export class HeaderService implements IHeaderService {
    private readonly destroyRef = inject(DestroyRef);
    private filterableColumns: string[];

    constructor(
        private fm: KlesForm,
        @Optional() private filterService: FilterService | null,
        @Optional() private filterStore: FilterStore | null,
        @Inject(DATASOURCE_SERVICE) private datasourceService: IDatasourceService,
        @Inject(LOADER_SERVICE) private loader: ILoader<any>,
        private columnsService: ColumnsService,
        private readonly eventsService: EventsService,
    ) {
        this.filterableColumns = this.columnsService
            .columns()
            .filter((c) => c.filterable === true)
            .map((c) => c.columnDef);
    }

    public register() {
        this.load();

        const header = this.fm.getHeader();

        const filterControlChanges$ = merge(
            ...this.filterableColumns.map((columnDef) => {
                const control = header.get(columnDef);

                if (!control) {
                    throw new Error(`Missing header filter control: ${columnDef}`);
                }

                return control.valueChanges.pipe(
                    debounceTime(300),
                    distinctUntilChanged((a, b) => _.isEqual(a, b)),
                    map((currentValue) => ({
                        columnDef,
                        currentValue,
                    })),
                );
            }),
        );

        filterControlChanges$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                scan(
                    (state, changed) => {
                        const previousValue = state.filters[changed.columnDef];

                        const changedFilter = {
                            columnDef: changed.columnDef,
                            previousValue,
                            currentValue: changed.currentValue,
                        };

                        const filters = {
                            ...state.filters,
                            [changed.columnDef]: changed.currentValue,
                        };

                        return {
                            filters,
                            changedFilter,
                        };
                    },
                    {
                        filters: Object.fromEntries(this.filterableColumns.map((columnDef) => [columnDef, header.get(columnDef)?.value])) as Record<
                            string,
                            unknown
                        >,
                        changedFilter: undefined as
                            | {
                                  columnDef: string;
                                  previousValue: unknown;
                                  currentValue: unknown;
                              }
                            | undefined,
                    },
                ),
            )
            .subscribe(({ filters, changedFilter }) => {
                if (this.filterService) {
                    const prepared = this.filterService.formatData(filters);
                    this.datasourceService.datasource.filter = JSON.stringify(prepared);
                    this.filterStore?.setFilters(prepared);
                } else {
                    this.filterStore?.setFilters(filters);
                    this.datasourceService.datasource.filter = JSON.stringify(filters);
                }

                this.eventsService.emit('filterChange', {
                    filters,
                    changedFilter,
                });
            });
    }

    private load() {
        this.loader
            .load()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((response) => !response.loading),
                map((response) => response.header),
                filter((header) => header != undefined),
                distinctUntilChanged((p, c) => {
                    return this.filterableColumns.every((col) => p?.[col] === c?.[col]);
                }),
            )
            .subscribe((header) => {
                this.fm.getHeader().patchValue(header, { emitEvent: false });
            });
    }
}

@Injectable()
export class HeaderLazyService implements IHeaderService {
    private readonly destroyRef = inject(DestroyRef);
    private filterableColumns: string[];

    constructor(
        private fm: KlesForm,
        @Optional() private filterStore: FilterStore | null,
        @Inject(LOADER_SERVICE) private loader: ILoader<any>,
        private columnsService: ColumnsService,
        private readonly eventsService: EventsService,
    ) {
        this.filterableColumns = this.columnsService
            .columns()
            .filter((c) => c.filterable === true)
            .map((c) => c.columnDef);
    }

    public register() {
        this.load();

        const header = this.fm.getHeader();

        const filterControlChanges$ = merge(
            ...this.filterableColumns.map((columnDef) => {
                const control = header.get(columnDef);

                if (!control) {
                    throw new Error(`Missing header filter control: ${columnDef}`);
                }

                return control.valueChanges.pipe(
                    debounceTime(300),
                    distinctUntilChanged((a, b) => _.isEqual(a, b)),
                    map((currentValue) => ({
                        columnDef,
                        currentValue,
                    })),
                );
            }),
        );

        filterControlChanges$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                scan(
                    (state, changed) => {
                        const previousValue = state.filters[changed.columnDef];

                        const changedFilter = {
                            columnDef: changed.columnDef,
                            previousValue,
                            currentValue: changed.currentValue,
                        };

                        const filters = {
                            ...state.filters,
                            [changed.columnDef]: changed.currentValue,
                        };

                        return {
                            filters,
                            changedFilter,
                        };
                    },
                    {
                        filters: Object.fromEntries(this.filterableColumns.map((columnDef) => [columnDef, header.get(columnDef)?.value])) as Record<
                            string,
                            unknown
                        >,
                        changedFilter: undefined as
                            | {
                                  columnDef: string;
                                  previousValue: unknown;
                                  currentValue: unknown;
                              }
                            | undefined,
                    },
                ),
            )
            .subscribe(({ filters, changedFilter }) => {
                this.filterStore?.setFilters(filters);

                this.eventsService.emit('filterChange', {
                    filters,
                    changedFilter,
                });
            });
    }

    private load() {
        this.loader
            .load()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((response) => !response.loading),
                map((response) => response.header),
                filter((header) => header != undefined),
                distinctUntilChanged((p, c) => {
                    return this.filterableColumns.every((col) => p?.[col] === c?.[col]);
                }),
            )
            .subscribe((header) => {
                this.fm.getHeader().patchValue(header, { emitEvent: false });
            });
    }
}
