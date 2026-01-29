import {
    ComponentRef,
    DestroyableInjector,
    Directive,
    effect,
    Injector,
    input,
    OnDestroy,
    OnInit,
    Provider,
    signal,
    StaticProvider,
    Type,
    ViewContainerRef,
} from '@angular/core';
import { TableComponent } from '../components/table/table.component';
import { isDestroyable } from '../utils';
import { KlesTableConfig } from '../core/table/config.interface';
import { PaginateTableComponent } from '../components/paginate-table/paginate-table.component';
import { PaginatorStore } from '../services/store/paginator-store.service';
import { SortService } from '../services/features/sort/sort.service';
import { SortStore } from '../services/store/sort-store.service';
import { FilterService } from '../services/features/filter/filter.service';
import { FilterStore } from '../services/store/filter-store.service';
import { DragDropLazyService, DragDropService } from '../services/features/dragdrop/dragdrop.service';
import { COLUMNS, LOADER_CONFIG, PAGINATOR_CONFIG, ROW_DRAG_DROP, SELECTION_KEY, SORT_CONFIG, TABLE_SERVICE } from '../token';
import { KlesColumnConfig } from '../core/table/column.interface';
import { ColumnsService } from '../services/features/columns/columns.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { ScrollbarService } from '../services/features/scrollbar/scrollbar.service';
import { InfiniteScrollTableComponent } from '../components/infinite-scroll-table/infinite-scroll-table.component';
import { TableLazyService, TableService } from '../services/features/table/table.service';
import { KlesForm } from '../services/features/table/form';
import { LoaderLazyService, LoaderService } from '../services/features/loader/loader.service';

@Directive({
    selector: '[appDynamicTableLoader]',
})
export class DynamicTableLoaderDirective implements OnInit, OnDestroy {
    tableConfig = input.required<KlesTableConfig>();
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

    ngOnInit(): void {}

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
        const storeProviders = [SortStore, FilterStore, ...(this.tableConfig().paginator ? [PaginatorStore] : [])];
        const configProviders = [
            {
                provide: COLUMNS,
                useValue: signal<KlesColumnConfig[]>(this.tableConfig().columns || []),
            },
            {
                provide: LOADER_CONFIG,
                useValue: {
                    lazy: this.tableConfig().lazy,
                    lines: this.tableConfig().lines,
                },
            },
            {
                provide: SELECTION_KEY,
                useValue: '#select',
            },
            {
                provide: SORT_CONFIG,
                useValue: this.tableConfig().sortConfig,
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
        ];

        const featureProviders = [
            KlesForm,
            ColumnsService,
            ScrollbarService,
            ...(this.tableConfig().lazy
                ? [
                      LoaderLazyService,
                      {
                          provide: TABLE_SERVICE,
                          useClass: TableLazyService,
                      },
                      {
                          provide: ROW_DRAG_DROP,
                          useFactory: () => new DragDropLazyService(this.tableConfig().dragDropRows),
                      },
                  ]
                : [
                      LoaderService,
                      {
                          provide: TABLE_SERVICE,
                          useClass: TableService,
                      },
                      SortService,
                      FilterService,
                      {
                          provide: ROW_DRAG_DROP,
                          useFactory: (paginatorstore: PaginatorStore | null) => new DragDropService(this.tableConfig().dragDropRows, paginatorstore),
                          deps: [...(this.tableConfig().paginator ? [PaginatorStore] : [])],
                      },
                  ]),
        ];

        const providers: Array<Provider | StaticProvider> = [storeProviders, configProviders, featureProviders];

        return Injector.create({
            parent: this.viewContainerRef.injector,
            providers,
        });
    }
}
