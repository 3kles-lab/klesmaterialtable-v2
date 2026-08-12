import { CommonModule } from '@angular/common';
import {
    AfterViewInit,
    Component,
    DestroyRef,
    ElementRef,
    HostBinding,
    inject,
    Inject,
    OnDestroy,
    OnInit,
    Optional,
    Signal,
    ViewChild,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTable, MatTableModule } from '@angular/material/table';

import { ITable } from '../../core/table/table.interface';

import { CdkTableModule } from '@angular/cdk/table';
import { ArrayUiState, GroupUiState, KlesMaterialDynamicformsModule } from '@3kles/kles-material-dynamicforms';
import { HeaderFieldPipe } from '../../pipes/header-field.pipe';
import { CellFieldPipe, ExtraCellFieldPipe } from '../../pipes/cell-field.pipe';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DragDropService } from '../../services/features/dragdrop/dragdrop.service';
import { DATASOURCE_SERVICE, LOADER_SERVICE, ROW_DRAG_DROP, SELECTION_SERVICE, SORT_SERVICE, TABLE_SERVICE } from '../../token';
import { ResolveNgStylePipe } from '../../pipes/ng-style.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResizableColumnDirective } from '../../directives/resizable-column.directive';
import { ScrollbarService } from '../../services/features/scrollbar/scrollbar.service';

import { ScrollbarApi } from '../../core/api/scrollbar';
import { KlesTableConnectorService } from '../../kles-table-connector.service';
import { ColumnApi } from '../../core/api/column';
import { ColumnsService } from '../../services/features/columns/columns.service';
import { PaginationApi } from '../../core/api/pagination';
import { SelectionApi } from '../../core/api/selection';
import { LoadingService } from '../../services/features/loading/loading.service';
import { PaginatorService } from '../../services/features/paginator/paginator.service';
import { SortApi } from '../../core/api/sort';
import { ISortService } from '../../services/features/sort/sort.service';
import { FilterService } from '../../services/features/filter/filter.service';
import { IDatasourceService } from '../../services/features/datasource/datasource.service';
import { IKlesDataSource } from '../../core/datasource/datasource.interface';
import { LoadingApi } from '../../core/api/loading';
import { ITableService } from '../../services/features/table/table.service';
import { ISelectionService } from '../../services/features/selection/selection.service';
import { FooterFieldPipe } from '../../pipes/footer-field.pipe';
import { ColumnSeparatorConfig, KlesColumnConfig } from '../../core/table/column.interface';
import { ILoader } from '../../services/features/loader/loader.interface';
import { FooterService } from '../../services/features/footer/footer.service';
import { FooterApi } from '../../core/api/footer';
import { UiFieldPipe } from '../../pipes/ui-field.pipe';
import { SpanPipe } from '../../pipes/span.pipe';
import { ExtraRowService } from '../../services/features/extra-row/extra-row.service';
import { ExtraRowConfig } from '../../core/table/config.interface';

import { RenderService } from '../../services/features/render/render.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExpandedRowStore } from '../../services/store/expanded-row-store.service';
import { KlesCellComponent } from '../cell/cell.component';
import { KlesHeaderComponent } from '../header/header.component';
import { HeaderPipe } from '../../pipes/header.pipe';
import { FormApi } from '../../core/api/form';
import { RowFormFactory } from '../../services/features/table/row-factory.service';
import { EventsApi } from '../../core/api/events';
import { EventsService } from '../../services/features/events/events.service';
import { RowService } from '../../services/features/row/row.service';
import { CellService } from '../../services/features/cell/cell.service';

type TableSection = 'header' | 'body' | 'footer';

@Component({
    selector: 'kles-table',
    styleUrl: './table.component.scss',
    templateUrl: './table.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSortModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        CdkTableModule,
        KlesMaterialDynamicformsModule,
        HeaderFieldPipe,
        CellFieldPipe,
        UiFieldPipe,
        FooterFieldPipe,
        SpanPipe,
        ExtraCellFieldPipe,
        DragDropModule,
        ResolveNgStylePipe,
        MatProgressSpinnerModule,
        ResizableColumnDirective,
        MatIconModule,
        KlesCellComponent,
        KlesHeaderComponent,
        HeaderPipe,
    ],
})
export class TableComponent implements ITable, OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatTable) table!: MatTable<FormGroup>;
    @ViewChild(MatSort, { static: true }) matSort!: MatSort;
    @ViewChild('form', { static: true }) formElemRef!: ElementRef<HTMLElement>;

    headerHeightPx = 56;
    scrollHeightPx = 0;
    footerHeightPx = 0;

    dataSource: IKlesDataSource;
    columns: Signal<KlesColumnConfig[]>;
    displayedColumns: Signal<string[]> | undefined;
    showFooter: Signal<boolean>;

    multiTemplateDataRows: Signal<boolean>;
    extraRows: Signal<(ExtraRowConfig & { displayedColumns: string[] })[]>;

    private ro?: ResizeObserver;
    private readonly destroyRef = inject(DestroyRef);
    private rafId?: number;
    private _cleanup?: () => void;

    constructor(
        private readonly host: ElementRef<HTMLElement>,
        private readonly connectorService: KlesTableConnectorService,
        @Inject(LOADER_SERVICE) private readonly loader: ILoader<any>,
        @Inject(DATASOURCE_SERVICE) private readonly datasourceService: IDatasourceService,
        @Inject(TABLE_SERVICE) public readonly tableService: ITableService,
        @Inject(ROW_DRAG_DROP) public readonly dragDropRowService: DragDropService,
        @Inject(SELECTION_SERVICE) private readonly selectionService: ISelectionService,
        public readonly columnsService: ColumnsService,
        public readonly loadingService: LoadingService,
        private readonly paginatorService: PaginatorService,
        private readonly scrollbarService: ScrollbarService,
        private readonly footerService: FooterService,
        private readonly extraRowService: ExtraRowService,
        private readonly renderService: RenderService,
        @Inject(SORT_SERVICE) private readonly sortService: ISortService,
        @Optional() private readonly filterService: FilterService,
        private readonly expandedRowStore: ExpandedRowStore,
        private readonly rowFactory: RowFormFactory,
        private readonly eventsService: EventsService,
        public readonly rowService: RowService,
        public readonly cellService: CellService,
    ) {
        this.columns = this.columnsService.columns;
        this.displayedColumns = this.columnsService.displayedColumns;
        this.showFooter = this.footerService.footer;
        this.dataSource = this.datasourceService.datasource;
        this.multiTemplateDataRows = this.extraRowService.multiTemplateDataRows;
        this.extraRows = this.extraRowService.rows;

        this.connectorService.connect(this);
        this.filterService?.register();
    }

    @HostBinding('class.loading')
    get isLoadingClass() {
        return this.loadingService.loading();
    }

    get events(): EventsApi {
        return {
            listen: () => this.eventsService.events$,
        };
    }

    get form(): FormApi {
        return {
            header: {
                clear: (value, options) => this.tableService.klesForm.getHeader().reset(value, options),
                get: () => this.tableService.klesForm.getHeader(),
                setValue: (value, options) => this.tableService.klesForm.getHeader().setValue(value, options),
                patchValue: (value, options) => this.tableService.klesForm.getHeader().patchValue(value, options),
            },
            footer: {
                clear: (value, options) => this.tableService.klesForm.getFooter().reset(value, options),
                get: () => this.tableService.klesForm.getFooter(),
                setValue: (value, options) => this.tableService.klesForm.getFooter().setValue(value, options),
                patchValue: (value, options) => this.tableService.klesForm.getFooter().patchValue(value, options),
            },
            rows: {
                list: () => this.tableService.klesForm.getRows(),
                get: (_id) => this.tableService.klesForm.getRows().controls.find((row) => row.value._id === _id),
                create: (value, index, options) => {
                    return this.tableService.klesForm.insertRow(
                        this.rowFactory.createRow(
                            this.columnsService
                                .columns()
                                .map((col) => ({ ...col.cell.field, name: col.columnDef }))
                                .concat(this.extraRowService.extraColumns().map((col) => ({ ...col, name: col.columnDef }))),
                            value,
                        ),
                        index,
                        options,
                    ).formGroup;
                },
                patch: (_id, value, options) => {
                    return this.tableService.klesForm.updateRow(_id, value, options);
                },
                remove: (_id, options) => {
                    this.tableService.klesForm.deleteRowById(_id, options);
                },
                reset: (_id, value, options) => {
                    this.tableService.klesForm.resetRow(_id, value, options);
                },
            },
        };
    }

    get scrollbar(): ScrollbarApi {
        return {
            getTop: () => this.scrollbarService.getTop(),
            to: (top, left, sb) => this.scrollbarService.to(top, left, sb),
            toTop: (sb) => this.scrollbarService.toTop(sb),
            toLeft: (sb) => this.scrollbarService.toLeft(sb),
            toBottom: (sb) => this.scrollbarService.toBottom(sb),
            toRight: (sb) => this.scrollbarService.toRight(sb),
        };
    }

    get column(): ColumnApi {
        return {
            setVisible: (columnDef, visible) => this.columnsService.setVisible(columnDef, visible),
            toggleVisible: (columnDef) => this.columnsService.toggleVisible(columnDef),
            changeWidth: (columnDef, options) => this.columnsService.changeWidth(columnDef, options),
            setResizable: (columnDef, resizable) => this.columnsService.setResizable(columnDef, resizable),
            toggleResizable: (columnDef) => this.columnsService.toggleResizable(columnDef),
            setSticky: (columnDef, options) => this.columnsService.setSticky(columnDef, options),
            columns: () => this.columnsService.columns(),
            setColumnPosition: (columnDef, position) => this.columnsService.setColumnPosition(columnDef, position),
        };
    }

    get pagination(): PaginationApi {
        return {
            setPageIndex: (index) => this.paginatorService.setPageIndex(index),
            setPageSize: (size) => this.paginatorService.setPageSize(size),
            firstPage: () => this.paginatorService.firstPage(),
            lastPage: () => this.paginatorService.lastPage(),
            enable: () => this.paginatorService.enable(),
            disable: () => this.paginatorService.disable(),
            setPageSizeOptions: (option) => this.paginatorService.setPageSizeOptions(option),
            page: this.paginatorService.pageChanged(),
        };
    }

    get selection(): SelectionApi {
        return {
            disable: () => this.selectionService.disable(),
            enable: () => this.selectionService.enable(),
            count: this.selectionService.count(),
            selectionModel: this.selectionService.selectionModel,
            // changed: () => {},
            // isEmpty: () => {},
            // isMultipleSelection: () => {},
            // selected: () => {},
        };
    }

    get sort(): SortApi {
        return {
            setActive: (active) => this.sortService.setActive(active),
            setDirection: (direction) => this.sortService.setDirection(direction),
            sortChange: () => this.sortService.sortChange(),
        };
    }

    get loading(): LoadingApi {
        return {
            start: () => this.loadingService.start(),
            stop: () => this.loadingService.stop(),
        };
    }

    get footer(): FooterApi {
        return {
            hide: () => this.footerService.hide(),
            show: () => this.footerService.show(),
        };
    }

    get ui(): GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState;
        footer: GroupUiState;
    }> {
        return this.tableService.ui;
    }

    refresh() {
        this.loader.refresh();
    }

    ngOnInit(): void {
        this.sortService.register(this.matSort);
        const el = this.formElemRef.nativeElement;
        this.scrollbarService.register(el);

        this.renderService
            .render()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.table?.renderRows();
            });

        this.expandedRowStore.expandedIds$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
            this.table?.renderRows();
        });
    }

    ngAfterViewInit(): void {
        this.calculHeaderHeight();
    }

    ngOnDestroy(): void {
        this._cleanup?.();
        this.scrollbarService.unregister();
    }

    submit() {
        // TODO
    }

    getColumnSeparator(column: KlesColumnConfig, section: TableSection): string | null {
        if (!column.separator) {
            return null;
        }

        const config: ColumnSeparatorConfig = column.separator === true ? {} : column.separator;

        if (config[section] === false) {
            return null;
        }

        const displayedColumns = this.displayedColumns?.() ?? [];
        const isLastColumn = displayedColumns.at(-1) === column.columnDef;

        if (isLastColumn && config.showAfterLastColumn !== true) {
            return null;
        }

        const width = config.width ?? '1px';
        const style = config.style ?? 'solid';
        const color = config.color ?? 'rgba(196, 198, 208, 1)';

        return `${width} ${style} ${color}`;
    }

    private calculHeaderHeight() {
        const formNativeElem = this.formElemRef?.nativeElement as HTMLElement | null;
        const header = this.host.nativeElement.querySelector('.mat-mdc-header-row') as HTMLElement | null;
        const footer = this.host.nativeElement.querySelector('.mat-mdc-footer-row') as HTMLElement | null;

        const compute = () => {
            this.scrollHeightPx = Math.max(0, (formNativeElem?.offsetHeight ?? 0) - (formNativeElem?.clientHeight ?? 0));
            this.headerHeightPx = Math.ceil(header?.getBoundingClientRect().height ?? 0);
            this.footerHeightPx = Math.max(0, footer?.getBoundingClientRect().height ?? 0);
        };

        const scheduleCompute = () => {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
            }
            this.rafId = requestAnimationFrame(() => {
                compute();
                this.rafId = requestAnimationFrame(compute);
            });
        };

        scheduleCompute();

        this.ro = new ResizeObserver(scheduleCompute);
        if (formNativeElem) {
            this.ro.observe(formNativeElem);
        }

        if (header) {
            this.ro.observe(header);
        }

        if (footer) {
            this.ro.observe(footer);
        }

        if (formNativeElem) {
            formNativeElem.addEventListener('scroll', scheduleCompute, { passive: true });
            window.addEventListener('resize', scheduleCompute, { passive: true });

            this._cleanup = () => {
                formNativeElem.removeEventListener('scroll', scheduleCompute);
                window.removeEventListener('resize', scheduleCompute);
                this.ro?.disconnect();
                if (this.rafId) {
                    cancelAnimationFrame(this.rafId);
                }
            };
        }
    }
}
