import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { MatSort } from '@angular/material/sort';

@Injectable()
export class SortService {
    public sortingDataAccessor = (item: AbstractControl, property) => {
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

    public sortData(columns: any[]) {
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
