import {
    ComponentRef,
    DestroyableInjector,
    Directive,
    effect,
    Injector,
    inject,
    input,
    OnDestroy,
    Provider,
    signal,
    StaticProvider,
    Type,
    ViewContainerRef,
} from '@angular/core';
import { TableComponent } from '../components/table/table.component';
import { isDestroyable } from '../utils';
import { ExtraRowConfig, KlesTableConfig } from '../core/table/config.interface';
import { PaginateTableComponent } from '../components/paginate-table/paginate-table.component';
import { PaginatorStore } from '../services/store/paginator-store.service';
import { SortLazyService, SortService } from '../services/features/sort/sort.service';
import { SortStore } from '../services/store/sort-store.service';
import { FilterService } from '../services/features/filter/filter.service';
import { FilterStore } from '../services/store/filter-store.service';
import { DragDropLazyService, DragDropService } from '../services/features/dragdrop/dragdrop.service';
import {
    COLUMNS,
    DATASOURCE_SERVICE,
    FOOTER,
    HEADER_SERVICE,
    LINES_SERVICE,
    LOADER_SERVICE,
    LOADER_CONFIG,
    PAGINATOR_CONFIG,
    ROW_DRAG_DROP,
    SELECTION_CONFIG,
    SELECTION_SERVICE,
    SORT_CONFIG,
    SORT_SERVICE,
    TABLE_SERVICE,
    SCROLLBAR_ORCHESTRATOR_SERVICE,
    EXTRA_ROWS,
    MULTI_UNFOLD,
    EMPTY_STATE_CONFIG,
} from '../token';
import { KlesColumnConfig } from '../core/table/column.interface';
import { ColumnsService } from '../services/features/columns/columns.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { ScrollbarService } from '../services/features/scrollbar/scrollbar.service';
import { InfiniteScrollTableComponent } from '../components/infinite-scroll-table/infinite-scroll-table.component';

import { KlesForm } from '../services/features/table/form';
import { SelectionLoaderService } from '../services/features/selection/selection-loader.service';
import { LoadingService } from '../services/features/loading/loading.service';
import { HeaderLazyService, HeaderService } from '../services/features/header/header.service';
import { DatasourceLazyService, DatasourceService } from '../services/features/datasource/datasource.service';
import { PaginatorService } from '../services/features/paginator/paginator.service';
import { SelectionLazyService, SelectionService } from '../services/features/selection/selection.service';
import { LinesLazyService, LinesService } from '../services/features/lines/lines.service';
import { TableService } from '../services/features/table/table.service';
import { LoaderLazyService, LoaderService } from '../services/features/loader/loader.service';
import { LoadingOrchestratorService } from '../services/features/loading/loading-orchestrator.service';
import { ScrollbarLazyOrchestratorService, ScrollbarOrchestratorService } from '../services/features/scrollbar/scrollbar-orchestrator.service';
import { FooterService } from '../services/features/footer/footer.service';
import { KlesExtraCellFieldConfig } from '../core/table/cell.interface';
import { ExtraRowService } from '../services/features/extra-row/extra-row.service';
import { RenderService } from '../services/features/render/render.service';
import { ExpandedRowStore } from '../services/store/expanded-row-store.service';
import { TreeService } from '../services/features/tree/tree.service';
import { LoaderChildrensService } from '../services/features/loader/loader-childrens.service';
import { EventsService } from '../services/features/events/events.service';
import { RowService } from '../services/features/row/row.service';
import { CellService } from '../services/features/cell/cell.service';
import { CellValueChangeService } from '../services/features/cell/cell-valuechange.service';
import { ValidationService } from '../services/features/validation/validation.service';
import { KlesTableIntl } from '../components/table/table-intl';
import { KlesTableEmptyStateComponent } from '../components/empty-state/empty-state.component';
import { EmptyStateService } from '../services/features/empty-state/empty-state.service';
import { RowContextStore } from '../services/store/row-context-store.service';

@Directive({
    selector: '[appDynamicTableLoader]',
})
export class DynamicTableLoaderDirective implements OnDestroy {
    tableConfig = input.required<KlesTableConfig, KlesTableConfig>({
        transform: (v) => {
            v.columns = v.columns.map((col) => {
                if (col.headerCell?.field) {
                    col.headerCell.field.subscriptSizing = col.headerCell.field.subscriptSizing ?? 'dynamic';
                }
                return { ...col, separator: col.separator ?? v.columnSeparator ?? false };
            });
            return v;
        },
    });
    private componentRef: ComponentRef<any> | null = null;

    constructor(private viewContainerRef: ViewContainerRef) {
        effect(() => {
            if (this.tableConfig()) {
                this.loadComponent();
            } else {
                this.clearComponent();
            }
        });
    }

    ngOnDestroy(): void {
        this.clearComponent();
    }

    private loadComponent() {
        if (this.componentRef) {
            this.clearComponent();
        }

        this.viewContainerRef.clear();

        let component: Type<any> = TableComponent;

        if (this.tableConfig().paginator) {
            component = PaginateTableComponent;
        } else if (this.tableConfig().infinite) {
            component = InfiniteScrollTableComponent;
        }

        const injector = this.initInjector();

        this.componentRef = this.viewContainerRef.createComponent(component, {
            injector,
        });

        this.componentRef.onDestroy(() => {
            if (isDestroyable(injector)) {
                injector.destroy();
            }
        });
    }

    private clearComponent() {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
    }

    private initInjector(): DestroyableInjector {
        const storeProviders = [RowContextStore, SortStore, FilterStore, ...(this.tableConfig().paginator ? [PaginatorStore] : []), ExpandedRowStore];

        const emptyState = this.tableConfig().emptyState;

        const emptyStateIntl = typeof emptyState === 'object' && emptyState !== null ? emptyState.intl : undefined;

        const configProviders = [
            {
                provide: COLUMNS,
                useValue: signal<KlesColumnConfig[]>(this.tableConfig().columns || []),
            },
            {
                provide: EXTRA_ROWS,
                useValue: signal<ExtraRowConfig[]>(this.tableConfig().extraRows ?? []),
            },
            {
                provide: MULTI_UNFOLD,
                useValue: this.tableConfig().multiUnfold ?? false,
            },
            {
                provide: FOOTER,
                useValue: signal<boolean>(this.tableConfig().footer ?? false),
            },
            {
                provide: LOADER_CONFIG,
                useValue: {
                    lazy: this.tableConfig().lazy,
                    lines: this.tableConfig().lines,
                },
            },
            {
                provide: SORT_CONFIG,
                useValue: this.tableConfig().sortConfig,
            },
            {
                provide: SELECTION_CONFIG,
                useValue: this.tableConfig().selection,
            },

            {
                provide: PAGINATOR_CONFIG,
                useValue: {
                    paginator: this.tableConfig().paginator || false,
                    customMatPaginatorIntl: this.tableConfig().customMatPaginatorIntl,
                    pageSize: this.tableConfig().pageSize,
                    pageSizeOptions: this.tableConfig().pageSizeOptions,
                },
            },
            ...(this.tableConfig().customMatPaginatorIntl
                ? [
                      {
                          provide: MatPaginatorIntl,
                          useClass: this.tableConfig().customMatPaginatorIntl,
                      },
                  ]
                : []),
            {
                provide: EMPTY_STATE_CONFIG,
                useValue: emptyState,
            },
            ...(emptyStateIntl
                ? [
                      {
                          provide: KlesTableIntl,
                          useClass: emptyStateIntl,
                      },
                  ]
                : []),
        ];

        const orchestratorProviders = [
            LoadingOrchestratorService,
            ...(this.tableConfig().lazy
                ? [
                      {
                          provide: SCROLLBAR_ORCHESTRATOR_SERVICE,
                          useClass: ScrollbarLazyOrchestratorService,
                      },
                  ]
                : [
                      {
                          provide: SCROLLBAR_ORCHESTRATOR_SERVICE,
                          useClass: ScrollbarOrchestratorService,
                      },
                  ]),
        ];

        const datasourceProvider = this.tableConfig().lazy
            ? [
                  {
                      provide: DATASOURCE_SERVICE,
                      useClass: DatasourceLazyService,
                  },
              ]
            : [
                  {
                      provide: DATASOURCE_SERVICE,
                      useClass: DatasourceService,
                  },
              ];

        const featureProviders = [
            TreeService,
            RenderService,
            ExtraRowService,
            EmptyStateService,
            LoadingService,
            KlesForm,
            ColumnsService,
            FooterService,
            ScrollbarService,
            EventsService,
            RowService,
            CellService,
            CellValueChangeService,
            ValidationService,
            SelectionLoaderService,
            PaginatorService,
            LoaderChildrensService,
            {
                provide: TABLE_SERVICE,
                useClass: TableService,
            },

            ...(this.tableConfig().lazy
                ? [
                      {
                          provide: HEADER_SERVICE,
                          useClass: HeaderLazyService,
                      },
                      {
                          provide: LOADER_SERVICE,
                          useClass: LoaderLazyService,
                      },
                      {
                          provide: LINES_SERVICE,
                          useClass: LinesLazyService,
                      },
                      {
                          provide: SELECTION_SERVICE,
                          useClass: SelectionLazyService,
                      },

                      {
                          provide: ROW_DRAG_DROP,
                          useFactory: () =>
                              new DragDropLazyService(
                                  this.tableConfig().dragDropRows,
                                  inject(EventsService),
                                  inject(KlesForm),
                                  inject(Injector),
                                  this.tableConfig().id,
                              ),
                      },
                      {
                          provide: SORT_SERVICE,
                          useClass: SortLazyService,
                      },
                  ]
                : [
                      {
                          provide: LOADER_SERVICE,
                          useClass: LoaderService,
                      },
                      {
                          provide: HEADER_SERVICE,
                          useClass: HeaderService,
                      },
                      {
                          provide: LINES_SERVICE,
                          useClass: LinesService,
                      },
                      {
                          provide: SELECTION_SERVICE,
                          useClass: SelectionService,
                      },

                      FilterService,
                      {
                          provide: ROW_DRAG_DROP,
                          useFactory: () =>
                              new DragDropService(
                                  this.tableConfig().dragDropRows,
                                  inject(EventsService),
                                  inject(KlesForm),
                                  inject(Injector),
                                  this.tableConfig().id,
                              ),
                      },
                      {
                          provide: SORT_SERVICE,
                          useClass: SortService,
                      },
                  ]),
        ];

        const providers: Array<Provider | StaticProvider> = [
            storeProviders,
            configProviders,
            datasourceProvider,
            featureProviders,
            orchestratorProviders,
        ];

        return Injector.create({
            parent: this.viewContainerRef.injector,
            providers,
        });
    }
}
