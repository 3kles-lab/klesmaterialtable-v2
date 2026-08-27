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
import {
    CellMousePayload,
    CellValueChangePayload,
    FilterChangePayload,
    LoadErrorPayload,
    PageChangePayload,
    RowMousePayload,
    RowDropErrorPayload,
    RowDropPayload,
    SelectionChangePayload,
    SelectionErrorPayload,
    SortPayload,
    TreePayload,
} from './services/features/events/event-payloads.model';
import { EmptyStateApi } from './core/api/empty-state';
import { RenderApi } from './core/api/render';
import { EventsApi } from './core/api/events';
import { TreeApi } from './core/api/tree';

@Component({
    selector: 'kles-dynamic-table',
    templateUrl: './kles-table.component.html',
    standalone: true,
    imports: [DynamicTableLoaderDirective],
    providers: [KlesTableConnectorService],
    styleUrl: './kles-table.component.scss',
})
export class KlesTableComponent<TValue = unknown> implements OnInit, KlesTableApi<TValue> {
    tableConfig = input.required<KlesTableConfig>();
    private readonly destroyRef = inject(DestroyRef);

    @Output() tableEvent = new EventEmitter<TableEvent<TValue>>();

    @Output() rowClick = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowDoubleClick = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowContextMenu = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowMouseEnter = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowMouseLeave = new EventEmitter<RowMousePayload<TValue>>();
    @Output() rowDrop = new EventEmitter<RowDropPayload<TValue>>();
    @Output() rowDropSuccess = new EventEmitter<RowDropPayload<TValue>>();
    @Output() rowDropError = new EventEmitter<RowDropErrorPayload<TValue>>();

    @Output() cellClick = new EventEmitter<CellMousePayload<TValue>>();
    @Output() cellDoubleClick = new EventEmitter<CellMousePayload<TValue>>();
    @Output() cellContextMenu = new EventEmitter<CellMousePayload<TValue>>();
    @Output() cellValueChange = new EventEmitter<CellValueChangePayload<TValue>>();

    @Output() selectionChange = new EventEmitter<SelectionChangePayload<TValue>>();
    @Output() selectionError = new EventEmitter<SelectionErrorPayload<TValue>>();
    @Output() pageChange = new EventEmitter<PageChangePayload>();
    @Output() sortChange = new EventEmitter<SortPayload>();
    @Output() filterChange = new EventEmitter<FilterChangePayload>();
    @Output() loadError = new EventEmitter<LoadErrorPayload>();
    @Output() nodeExpand = new EventEmitter<TreePayload<TValue>>();
    @Output() nodeCollapse = new EventEmitter<TreePayload<TValue>>();
    @Output() nodeLoadChildren = new EventEmitter<TreePayload<TValue>>();
    @Output() nodeChildrenLoaded = new EventEmitter<TreePayload<TValue>>();

    readonly elevationShadow = computed(() => {
        const level = this.tableConfig().elevation ?? 2;

        return level === 0 ? 'none' : `var(--mat-sys-level${level})`;
    });

    // @Output() lazyQueryChange = new EventEmitter<KlesTableLazyQueryChangePayload>();

    constructor(private connectorService: KlesTableConnectorService) {}

    ngOnInit(): void {
        this.connectorService.connected$
            .pipe(
                filter((connected) => connected),
                switchMap(() => {
                    return this.events.listen();
                }),
                takeUntilDestroyed(this.destroyRef),
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

    get emptyState(): EmptyStateApi {
        return this.connectorService.emptyState;
    }

    get render(): RenderApi {
        return this.connectorService.render;
    }

    get events(): EventsApi<TValue> {
        return this.connectorService.events as EventsApi<TValue>;
    }

    get tree(): TreeApi {
        return this.connectorService.tree;
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

            case 'rowMouseEnter':
                this.rowMouseEnter.emit(event.payload);
                break;

            case 'rowMouseLeave':
                this.rowMouseLeave.emit(event.payload);
                break;

            case 'rowDrop':
                this.rowDrop.emit(event.payload);
                break;

            case 'rowDropSuccess':
                this.rowDropSuccess.emit(event.payload);
                break;

            case 'rowDropError':
                this.rowDropError.emit(event.payload);
                break;

            case 'cellClick':
                this.cellClick.emit(event.payload);
                break;

            case 'cellDoubleClick':
                this.cellDoubleClick.emit(event.payload);
                break;

            case 'cellContextMenu':
                this.cellContextMenu.emit(event.payload);
                break;

            case 'cellValueChange':
                this.cellValueChange.emit(event.payload);
                break;

            case 'selectionChange':
                this.selectionChange.emit(event.payload);
                break;

            case 'selectionError':
                this.selectionError.emit(event.payload);
                break;

            case 'pageChange':
                this.pageChange.emit(event.payload);
                break;

            case 'sortChange':
                this.sortChange.emit(event.payload);
                break;

            case 'filterChange':
                this.filterChange.emit(event.payload);
                break;

            // case 'lazyQueryChange':
            //     this.lazyQueryChange.emit(event.payload);
            //     break;

            case 'loadError':
                this.loadError.emit(event.payload);
                break;

            case 'nodeExpand':
                this.nodeExpand.emit(event.payload);
                break;

            case 'nodeCollapse':
                this.nodeCollapse.emit(event.payload);
                break;

            case 'nodeLoadChildren':
                this.nodeLoadChildren.emit(event.payload);
                break;

            case 'nodeChildrenLoaded':
                this.nodeChildrenLoaded.emit(event.payload);
                break;
        }
    }
}
