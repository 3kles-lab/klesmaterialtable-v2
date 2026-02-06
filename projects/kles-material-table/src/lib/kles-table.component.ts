import { Component, HostBinding, input, OnInit } from '@angular/core';
import { DynamicTableLoaderDirective } from './directives/dynamic-table-loader.directive';
import { KlesTableConfig } from './core/table/config.interface';
import { KlesTableConnectorService } from './kles-table-connector.service';
import { KlesTableApi } from './core/api/table';
import { ScrollbarApi } from './core/api/scrollbar';
import { ColumnApi } from './core/api/column';
import { PaginationApi } from './core/api/pagination';
import { SortApi } from './core/api/sort';
import { LoadingApi } from './core/api/loading';
import { SelectionApi } from './core/api/selection';
import { FormApi } from './core/api/form';

@Component({
    selector: 'kles-dynamic-table',
    templateUrl: './kles-table.component.html',
    standalone: true,
    imports: [DynamicTableLoaderDirective],
    providers: [KlesTableConnectorService],
    styleUrl: './kles-table.component.scss',
})
export class KlesTableComponent implements OnInit, KlesTableApi {
    tableConfig = input.required<KlesTableConfig>();

    constructor(private connectorService: KlesTableConnectorService) {}

    ngOnInit(): void {}

    @HostBinding('attr.id')
    get hostId() {
        return this.tableConfig()?.id ?? null;
    }

    refresh(): void {
        this.connectorService.refresh();
    }

    get scrollbar(): ScrollbarApi {
        return this.connectorService.scrollbar;
    }

    get column(): ColumnApi {
        return this.connectorService.column;
    }

    get pagination(): PaginationApi {
        return this.connectorService.pagination;
    }

    get sort(): SortApi {
        return this.connectorService.sort;
    }

    get loading(): LoadingApi {
        return this.connectorService.loading;
    }

    get selection(): SelectionApi {
        return this.connectorService.selection;
    }

    get form(): FormApi {
        return null;
    }
}
