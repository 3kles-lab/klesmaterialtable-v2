import {
    ComponentRef,
    DestroyableInjector,
    Directive,
    effect,
    EventEmitter,
    Injector,
    input,
    OnDestroy,
    OnInit,
    Output,
    Provider,
    signal,
    StaticProvider,
    Type,
    ViewContainerRef,
} from '@angular/core';
import { TableComponent } from '../components/table/table.component';
import { isDestroyable } from '../utils';
import { KlesTableConfig } from '../core/table/config.interface';
import { LoaderService } from '../services/loader.service';
import { KLES_DATA_SOURCE, KlesDataSource, KlesLazyDataSource } from '../components/table/datasource';

import { PaginateTableComponent } from '../components/paginate-table/paginate-table.component';
import { PaginatorStore } from '../services/store/paginator-store.service';
import { SortService } from '../services/features/sort/sort.service';
import { SortStore } from '../services/store/sort-store.service';
import { FilterService } from '../services/features/filter/filter.service';
import { FilterStore } from '../services/store/filter-store.service';
import { DragDropLazyService, DragDropService } from '../services/features/dragdrop/dragdrop.service';
import { KlesForm } from '../components/table/form';
import { ITable } from '../core/table/table.interface';
import { COLUMNS, LOADER_CONFIG, PAGINATOR_CONFIG, ROW_DRAG_DROP } from '../token';
import { KlesColumnConfig } from '../core/table/column.interface';
import { ColumnsService } from '../services/features/columns/columns.service';

@Directive({
    selector: '[appDynamicTableLoader]',
})
export class DynamicTableLoaderDirective implements OnInit, OnDestroy {
    tableConfig = input.required<KlesTableConfig>();
    private componentRef: ComponentRef<any> | null = null;

    @Output() created = new EventEmitter<ComponentRef<any>>();

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

        let component: Type<ITable> = TableComponent;

        if (this.tableConfig().paginator) {
            component = PaginateTableComponent;
        } else if (this.tableConfig().infinite) {
            // component = InfinitScrollTable
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
        this.created.emit(this.componentRef);
    }

    private clearComponent() {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
            this.created.emit(null);
        }
    }

    private initInjector(): DestroyableInjector {
        const storeProviders = [SortStore, FilterStore, ...(this.tableConfig().paginator ? [PaginatorStore] : [])];

        const providers: Array<Provider | StaticProvider> = [
            KlesForm,
            LoaderService,
            storeProviders,
            {
                provide: PAGINATOR_CONFIG,
                useValue: {
                    paginator: this.tableConfig().paginator || false,
                    customMatPaginatorIntl: this.tableConfig().customMatPaginatorIntl,
                    pageSize: this.tableConfig().pageSize,
                    pageSizeOptions: this.tableConfig().pageSizeOptions,
                },
            },
            ColumnsService,
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
                provide: ROW_DRAG_DROP,
                useFactory: (paginatorstore: PaginatorStore | null) => new DragDropService(this.tableConfig().dragDropRows, paginatorstore),
                deps: [],
            },
        ];

        if (this.tableConfig().lazy) {
            providers.push(
                ...[
                    {
                        provide: ROW_DRAG_DROP,
                        useFactory: () => new DragDropLazyService(this.tableConfig().dragDropRows),
                    },
                    {
                        provide: KLES_DATA_SOURCE,
                        useClass: KlesLazyDataSource,
                    },
                ],
            );
        } else {
            providers.push(
                ...[
                    SortService,
                    FilterService,
                    {
                        provide: ROW_DRAG_DROP,
                        useFactory: (paginatorstore: PaginatorStore | null) => new DragDropService(this.tableConfig().dragDropRows, paginatorstore),
                        deps: [...(this.tableConfig().paginator ? [PaginatorStore] : [])],
                    },
                    {
                        provide: KLES_DATA_SOURCE,
                        useClass: KlesDataSource,
                    },
                ],
            );
        }

        return Injector.create({
            parent: this.viewContainerRef.injector,
            providers,
        });
    }
}
