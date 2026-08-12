import { Component, computed, DestroyRef, EventEmitter, HostBinding, inject, input, OnInit, Output } from '@angular/core';
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
import { FooterApi } from './core/api/footer';
import { ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs';
import { TableEvent } from './services/features/events/events.model';
import { CellMousePayload, CellValueChangePayload, RowMousePayload } from './services/features/events/event-payloads.model';

@Component({
    selector: 'kles-dynamic-table',
    templateUrl: './kles-table.component.html',
    standalone: true,
    imports: [DynamicTableLoaderDirective],
    providers: [KlesTableConnectorService],
    styleUrl: './kles-table.component.scss',
})
export class KlesTableComponent<TValue = unknown> implements OnInit, KlesTableApi {
    tableConfig = input.required<KlesTableConfig>();
    private readonly destroyRef = inject(DestroyRef);

    @Output() tableEvent = new EventEmitter<TableEvent<TValue>>();

    @Output() rowClick = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowDoubleClick = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowContextMenu = new EventEmitter<RowMousePayload<TValue>>();

    @Output() cellClick = new EventEmitter<CellMousePayload<TValue>>();
    @Output() cellValueChange = new EventEmitter<CellValueChangePayload<TValue>>();

    readonly elevationShadow = computed(() => {
        const level = this.tableConfig().elevation ?? 2;

        return level === 0 ? 'none' : `var(--mat-sys-level${level})`;
    });

    // @Output() selectionChange = new EventEmitter<KlesTableSelectionChangePayload<TValue>>();

    // @Output() pageChange = new EventEmitter<KlesTablePageChangePayload>();
    // @Output() sortChange = new EventEmitter<KlesTableSortPayload>();
    // @Output() filterChange = new EventEmitter<KlesTableFilterChangePayload>();

    // @Output() lazyQueryChange = new EventEmitter<KlesTableLazyQueryChangePayload>();
    // @Output() loadError = new EventEmitter<KlesTableLoadErrorPayload>();

    constructor(private connectorService: KlesTableConnectorService) {}

    ngOnInit(): void {
        this.connectorService.connected$
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((connected) => connected),
                switchMap(() => {
                    return this.connectorService.events.listen();
                }),
            )
            .subscribe((event) => {
                this.dispatchEvent(event);
            });
    }

    @HostBinding('attr.id')
    get hostId() {
        return this.tableConfig()?.id ?? undefined;
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

    get pagination(): PaginationApi | undefined {
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
        return this.connectorService.form;
    }

    get footer(): FooterApi {
        return this.connectorService.footer;
    }

    get ui(): GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState;
        footer: GroupUiState;
    }> {
        return this.connectorService.ui;
    }

    private dispatchEvent(event: TableEvent<TValue>): void {
        this.tableEvent.emit(event);

        switch (event.type) {
            case 'rowClick':
                this.rowClick.emit(event.payload);
                break;

            case 'rowDoubleClick':
                this.rowDoubleClick.emit(event.payload);
                break;

            case 'rowContextMenu':
                this.rowContextMenu.emit(event.payload);
                break;

            case 'cellClick':
                this.cellClick.emit(event.payload);
                break;

            case 'cellValueChange':
                this.cellValueChange.emit(event.payload);
                break;

            // case 'selectionChange':
            //     this.selectionChange.emit(event.payload);
            //     break;

            // case 'pageChange':
            //     this.pageChange.emit(event.payload);
            //     break;

            // case 'sortChange':
            //     this.sortChange.emit(event.payload);
            //     break;

            // case 'filterChange':
            //     this.filterChange.emit(event.payload);
            //     break;

            // case 'lazyQueryChange':
            //     this.lazyQueryChange.emit(event.payload);
            //     break;

            // case 'loadError':
            //     this.loadError.emit(event.payload);
            //     break;
        }
    }
}
