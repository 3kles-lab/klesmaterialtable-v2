import { DestroyRef, EventEmitter, Inject, inject, Injectable, Optional } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatSort, Sort, SortDirection } from '@angular/material/sort';
import { SortStore } from '../../store/sort-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatasourceLazyService, DatasourceService } from '../datasource/datasource.service';
import { DATASOURCE_SERVICE } from '../../../token';
import { ColumnsService } from '../columns/columns.service';

export interface ISortService {
    sort: MatSort;
    register(s: MatSort);
    setDirection(direction: SortDirection);
    setActive(active: string);
    sortChange(): EventEmitter<Sort>;
}

@Injectable()
export abstract class AbstractSortService implements ISortService {
    protected _sort: MatSort;

    public get sort(): MatSort {
        return this._sort;
    }

    public register(s: MatSort) {
        this._sort = s;
    }

    public setDirection(direction: SortDirection) {
        if (this._sort) {
            this._sort.direction = direction;
            this.sort.sortChange.emit({ active: this._sort.active, direction: this._sort.direction });
        }
    }

    public setActive(active: string) {
        if (this._sort) {
            this._sort.active = active;
            this.sort.sortChange.emit({ active: this._sort.active, direction: this._sort.direction });
        }
    }

    public sortChange(): EventEmitter<Sort> {
        return this._sort.sortChange;
    }
}

@Injectable()
export class SortService extends AbstractSortService {
    protected readonly destroyRef = inject(DestroyRef);

    constructor(
        @Optional() private sortStore: SortStore | null,
        private columnsService: ColumnsService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
    ) {
        super();
    }

    public register(s: MatSort) {
        super.register(s);
        this.datasourceService.datasource.sort = this._sort;
        if (!this._sort) return;

        this.datasourceService.datasource.sortingDataAccessor = this.sortingDataAccessor;
        this.datasourceService.datasource.sortData = this.sortDataPredicate(this.columnsService.columns());

        s.active = this.sortStore?.snapshot()?.active ?? s.active;
        s.direction = this.sortStore?.snapshot()?.direction ?? s.direction;

        s.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            this.sortStore?.setSort(event);
        });
    }

    private sortingDataAccessor = (item: AbstractControl, property) => {
        if (!item.value) {
            return undefined;
        }
        let value: any = item.value?.[property];

        if (value) {
            if (typeof value === 'string') {
                value = value.toLowerCase();
            }
        }

        return value;
    };

    private sortDataPredicate(columns: any[]) {
        return (data: FormGroup[], sort: MatSort): FormGroup[] => {
            const active = sort.active;
            const direction = sort.direction;

            if (!active || direction == '') {
                return data;
            }
            const column = columns.find((col) => col.columnDef === active);

            return data.sort((a, b) => {
                let valueA: string | number;
                let valueB: string | number;
                if (column?.headerCell.sortPredicate) {
                    valueA = column?.headerCell.sortPredicate(a);
                    valueB = column?.headerCell.sortPredicate(b);
                } else {
                    valueA = this.sortingDataAccessor(a, active);
                    valueB = this.sortingDataAccessor(b, active);

                    if (column?.cell?.property) {
                        valueA = valueA?.[column.cell?.property];
                        valueB = valueB?.[column.cell?.property];
                    }
                }

                const valueAType = typeof valueA;
                const valueBType = typeof valueB;

                if (valueAType !== valueBType) {
                    if (valueAType === 'number') {
                        valueA += '';
                    }
                    if (valueBType === 'number') {
                        valueB += '';
                    }
                }

                let comparatorResult = 0;
                if (valueA != null && valueB != null) {
                    if (valueA > valueB) {
                        comparatorResult = 1;
                    } else if (valueA < valueB) {
                        comparatorResult = -1;
                    }
                } else if (valueA != null) {
                    comparatorResult = 1;
                } else if (valueB != null) {
                    comparatorResult = -1;
                }
                return comparatorResult * (direction == 'asc' ? 1 : -1);
            });
        };
    }
}

@Injectable()
export class SortLazyService extends AbstractSortService {
    protected readonly destroyRef = inject(DestroyRef);

    constructor(
        @Optional() private sortStore: SortStore | null,
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceLazyService,
    ) {
        super();
    }

    public register(s: MatSort) {
        super.register(s);
        this.datasourceService.datasource.sort = this._sort;
        if (!this._sort) return;

        s.active = this.sortStore?.snapshot()?.active ?? s.active;
        s.direction = this.sortStore?.snapshot()?.direction ?? s.direction;

        s.sortChange.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            this.sortStore?.setSort(event);
        });
    }
}
