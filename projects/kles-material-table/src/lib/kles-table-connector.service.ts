import { Injectable } from '@angular/core';
import { ITable } from './core/table/table.interface';
import { ScrollbarApi } from './core/api/scrollbar';
import { ColumnApi } from './core/api/column';
import { PaginationApi } from './core/api/pagination';
import { SortApi } from './core/api/sort';
import { LoadingApi } from './core/api/loading';

@Injectable()
export class KlesTableConnectorService {
    private table?: ITable;

    constructor() {}

    public connect(table: ITable) {
        this.table = table;
        return () => {
            if (this.table === table) {
                this.table = undefined;
            }
        };
    }

    get scrollbar(): ScrollbarApi {
        return this.table.scrollbar;
    }

    get column(): ColumnApi {
        return this.table.column;
    }

    get pagination(): PaginationApi | undefined {
        return this.table.pagination;
    }

    get sort(): SortApi {
        return this.table.sort;
    }

    get loading(): LoadingApi {
        return this.table.loading;
    }

    public refresh() {
        this.table.refresh();
    }
}
