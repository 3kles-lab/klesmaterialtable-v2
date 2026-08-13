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
                    const column: KlesColumnConfig | undefined = this.columnsService.columns().find((col) => col.columnDef === key);

                    if (column) {
                        if (column.headerCell?.filterPredicate) {
                            return column.headerCell.filterPredicate(keyValue, searchString[key]) || false;
                        }

                        if (keyValue != null && typeof keyValue === 'object' && column.cell?.field?.property) {
                            keyValue = keyValue[column.cell.field.property];
                        }
                        if (searchString?.[key] && typeof searchString[key] === 'object') {
                            if (Array.isArray(searchString[key])) {
                                if (!searchString[key].length) {
                                    return true;
                                }

                                const list = (searchString[key] as Array<any>)
                                    .map((m) => {
                                        const subkey = column.headerCell?.field?.property ?? column.cell?.field?.property;
                                        if (subkey) {
                                            return m?.[subkey] ?? m;
                                        }
                                        return m;
                                    })
                                    .map((value) => {
                                        return typeof value === 'string' ? value?.trim().toLowerCase() : value;
                                    });

                                return keyValue != undefined && list.includes(keyValue.toString().trim().toLowerCase());
                            } else {
                                const subKey = column.headerCell?.field?.property ?? column.cell?.field?.property;
                                if (subKey) {
                                    searchString[key] = searchString[key][subKey];
                                }
                            }
                        }
                    }
                    if (keyValue === null && searchString?.[key].length === 0) {
                        return true;
                    } else if (keyValue === null) {
                        return false;
                    } else if (searchString?.[key] === null) {
                        return true;
                    }
                    return keyValue !== null && keyValue.toString().trim().toLowerCase().indexOf(searchString?.[key].toString().toLowerCase()) !== -1;
                });
        };
    }
}
