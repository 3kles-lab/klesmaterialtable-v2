import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { KlesColumnConfig } from '../../../core/table/column.interface';
import * as _ from 'lodash';

@Injectable()
export class FilterService {
    public prepareFilterData(data: FormGroup): any {
        return data.getRawValue();
    }

    public createFilter(columns: KlesColumnConfig[]) {
        return (data: FormGroup, filter: string): boolean => {
            let searchString = JSON.parse(filter);
            const filterableColumn = columns.filter((f) => f.filterable).map((m) => m.columnDef);

            searchString = _.pick(searchString, filterableColumn);
            return Object.keys(searchString)
                .filter((f) => searchString[f] && filterableColumn.includes(f))
                .every((key) => {
                    let keyValue = data?.controls[key]?.value;
                    const column: KlesColumnConfig = columns.find((col) => col.columnDef === key);

                    if (column.headerCell.filterPredicate) {
                        return column.headerCell.filterPredicate(keyValue, searchString[key]) || false;
                    }

                    if (keyValue && typeof keyValue === 'object' && column.cell.property) {
                        keyValue = keyValue[column.cell.property];
                    }
                    if (searchString[key] && typeof searchString[key] === 'object') {
                        if (Array.isArray(searchString[key])) {
                            if (!searchString[key].length) {
                                return true;
                            }
                            const list =
                                column.headerCell.property || column.cell.property
                                    ? (searchString[key] as Array<any>).map((m) =>
                                          m[column.headerCell.property || column.cell.property].toLowerCase(),
                                      )
                                    : (searchString[key] as Array<any>).map((m) => m.toLowerCase());
                            return keyValue && list.includes(keyValue.toString().trim().toLowerCase());
                        } else {
                            if (column.headerCell.property || column.cell.property) {
                                searchString[key] = searchString[key][column.headerCell.property || column.cell.property];
                            }
                        }
                    }
                    if (!keyValue && searchString[key].length === 0) {
                        return true;
                    } else if (!keyValue) {
                        return false;
                    } else if (!searchString[key]) {
                        return true;
                    }
                    return keyValue && keyValue.toString().trim().toLowerCase().indexOf(searchString[key].toString().toLowerCase()) !== -1;
                });
        };
    }
}
