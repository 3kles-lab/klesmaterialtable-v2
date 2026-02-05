import { Inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { KlesColumnConfig } from '../../../core/table/column.interface';
import * as _ from 'lodash';
import { ColumnsService } from '../columns/columns.service';
import { DatasourceService } from '../datasource/datasource.service';
import { DATASOURCE_SERVICE } from '../../../token';

@Injectable()
export class FilterService {
    constructor(
        private columnsService: ColumnsService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: DatasourceService,
    ) {}

    public register() {
        this.datasourceService.datasource.filterPredicate = this.createFilterPredicate();
    }

    public formatData(data: { [key: string]: any }): any {
        return data;
    }

    private createFilterPredicate() {
        return (data: FormGroup, filter: string): boolean => {
            let searchString = JSON.parse(filter);
            const filterableColumn = this.columnsService
                .columns()
                .filter((f) => f.filterable)
                .map((m) => m.columnDef);

            searchString = _.pick(searchString, filterableColumn);
            return Object.keys(searchString)
                .filter((f) => searchString[f] && filterableColumn.includes(f))
                .every((key) => {
                    let keyValue = data?.controls[key]?.value;
                    const column: KlesColumnConfig = this.columnsService.columns().find((col) => col.columnDef === key);

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
