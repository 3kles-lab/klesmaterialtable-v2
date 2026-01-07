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
    StaticProvider,
    Type,
    ViewContainerRef,
} from '@angular/core';
import { TableComponent } from '../components/table/table.component';
import { isDestroyable } from '../utils';
import { KlesTableConfig } from '../core/table/config.interface';
import { LoaderService } from '../services/loader.service';
import { KLES_DATA_SOURCE, KlesDataSource, KlesLazyDataSource } from '../components/table/datasource';
import { COLUMNS, LOADER_CONFIG, ROW_DRAG_DROP } from '../core/table/token';
import { PaginateTableComponent } from '../components/paginate-table/paginate-table.component';
import { PaginatorStore } from '../services/store/paginator-store.service';
import { SortService } from '../services/features/sort/sort.service';
import { SortStore } from '../services/store/sort-store.service';
import { FilterService } from '../services/features/filter/filter.service';
import { FilterStore } from '../services/store/filter-store.service';
import { DragDropLazyService, DragDropService } from '../services/features/dragdrop/dragdrop.service';
import { KlesForm } from '../components/table/form';

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

        this.setInputs();
    }

    private clearComponent() {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = null;
        }
    }

    private setInputs(): void {
        // this.componentRef.setInput(
        //     'columns',
        //     // this.tableConfig().columns.map((column) => ({
        //     //     ...column,
        //     //     headerCell: { ...column.headerCell, name: column.columnDef },
        //     //     cell: { ...column.cell, name: column.columnDef },
        //     //     footerCell: { ...column.footerCell, name: column.columnDef },
        //     // })),
        //     // this.tableConfig().columns
        // );
        // this.componentRef.setInput('lines', this.tableConfig().lines)
        // if (this.tableConfig().paginator) {
        //     this.componentRef.setInput('pageSizeOptions', this.tableConfig().pageSizeOptions || [5, 10, 20, 25, 50]);
        //     this.componentRef.setInput('pageSize', this.tableConfig().pageSize || 10); //todo faire un service contenant les valeurs par défaut
        // }
    }

    private initInjector(): DestroyableInjector {
        const providers: Array<Provider | StaticProvider> = [
            KlesForm,
            LoaderService, //TODO mettre avec un provide pour le surchargement
            {
                provide: COLUMNS,
                useValue: this.tableConfig().columns,
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

        if (this.tableConfig().paginator) {
            providers.push(PaginatorStore);
        }

        if (this.tableConfig().lazy) {
            providers.push(
                ...[
                    SortStore,
                    FilterStore,
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
