import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';

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
}
