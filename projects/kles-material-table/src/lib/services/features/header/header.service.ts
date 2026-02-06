import { DestroyRef, Inject, inject, Injectable, Optional } from '@angular/core';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, filter, map, pairwise, startWith } from 'rxjs';
import { FilterService } from '../filter/filter.service';
import { FilterStore } from '../../store/filter-store.service';
import { DATASOURCE_SERVICE, LOADER_SERVICE } from '../../../token';
import { IDatasourceService } from '../datasource/datasource.service';
import { ColumnsService } from '../columns/columns.service';
import { ILoader } from '../loader/loader.service';

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
    ) {
        this.filterableColumns = this.columnsService
            .columns()
            .filter((c) => c.filterable === true)
            .map((c) => c.columnDef);
    }

    public register() {
        this.load();

        combineLatest(
            this.filterableColumns.map((k) =>
                this.fm
                    .getHeader()
                    .get(k)!
                    .valueChanges.pipe(
                        startWith(this.fm.getHeader().get(k)!.value),
                        map((value) => [k, value] as const),
                    ),
            ),
        )
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((entries) => Object.fromEntries(entries)),
            )
            .subscribe((value) => {
                if (this.filterService) {
                    const prepared = this.filterService.formatData(value);
                    this.datasourceService.datasource.filter = JSON.stringify(prepared);
                    this.filterStore?.setFilters(prepared);
                } else {
                    this.filterStore?.setFilters(value);
                    this.datasourceService.datasource.filter = JSON.stringify(value);
                }
            });
    }

    private load() {
        this.loader
            .load()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((response) => !response.loading),
                map((response) => response.header),
                distinctUntilChanged((p, c) => {
                    return this.filterableColumns.every((col) => p?.[col] === c?.[col]);
                }),
            )
            .subscribe((response) => {
                //TODO maj header
                console.log('maj header');
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
    ) {
        this.filterableColumns = this.columnsService
            .columns()
            .filter((c) => c.filterable === true)
            .map((c) => c.columnDef);
    }

    public register() {
        this.load();

        combineLatest(
            this.filterableColumns.map((k) =>
                this.fm
                    .getHeader()
                    .get(k)!
                    .valueChanges.pipe(
                        startWith(this.fm.getHeader().get(k)!.value),
                        map((value) => [k, value] as const),
                    ),
            ),
        )
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                map((entries) => Object.fromEntries(entries)),
            )
            .subscribe((value) => {
                this.filterStore?.setFilters(value);
            });
    }

    private load() {
        this.loader
            .load()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((response) => !response.loading),
                map((response) => response.header),
                distinctUntilChanged((p, c) => {
                    return this.filterableColumns.every((col) => p?.[col] === c?.[col]);
                }),
            )
            .subscribe((header) => {
                //TODO maj header
                console.log('header todo', header);
            });
    }
}
