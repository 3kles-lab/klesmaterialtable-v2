import { DestroyRef, Inject, inject, Injectable, Optional } from '@angular/core';
import { KlesForm } from '../table/form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, filter, map, pairwise, startWith } from 'rxjs';
import { FilterService } from '../filter/filter.service';
import { FilterStore } from '../../store/filter-store.service';
import { DATASOURCE_SERVICE } from '../../../token';
import { IDatasourceService } from '../datasource/datasource.service';
import { ColumnsService } from '../columns/columns.service';

@Injectable()
export class HeaderService {
    private readonly destroyRef = inject(DestroyRef);
    constructor(
        private fm: KlesForm,
        @Optional() private filterService: FilterService | null,
        @Optional() private filterStore: FilterStore | null,
        @Inject(DATASOURCE_SERVICE) private datasourceService: IDatasourceService,
        private columnsService: ColumnsService,
    ) {}

    public register() {
        const fiterableCols = this.columnsService
            .columns()
            .filter((c) => c.filterable === true)
            .map((c) => c.columnDef);

        combineLatest(
            fiterableCols.map((k) =>
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
                    this.filterStore?.setFilters(this.fm.getHeader().getRawValue());
                }
            });
    }
}
