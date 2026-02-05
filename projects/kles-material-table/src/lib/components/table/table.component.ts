import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostBinding, Inject, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTable, MatTableModule } from '@angular/material/table';

import { ITable } from '../../core/table/table.interface';

import { CdkTableModule } from '@angular/cdk/table';
import { KlesMaterialDynamicformsModule } from '@3kles/kles-material-dynamicforms';
import { HeaderFieldPipe } from '../../pipes/header-field.pipe';
import { CellFieldPipe } from '../../pipes/cell-field.pipe';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DragDropService } from '../../services/features/dragdrop/dragdrop.service';
import { DATASOURCE_SERVICE, LINES_SERVICE, ROW_DRAG_DROP, SELECTION_SERVICE, SORT_SERVICE, TABLE_SERVICE } from '../../token';
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
import { ILinesService } from '../../services/features/lines/lines.service';
import { ISelectionService } from '../../services/features/selection/selection.service';

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
        DragDropModule,
        ResolveNgStylePipe,
        MatProgressSpinnerModule,
        ResizableColumnDirective,
        MatIconModule,
    ],
})
export class TableComponent implements ITable, OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatTable) table!: MatTable<FormGroup>;
    @ViewChild(MatSort, { static: true }) matSort: MatSort;

    headerHeightPx = 56;
    private ro?: ResizeObserver;

    dataSource: IKlesDataSource;

    constructor(
        private connectorService: KlesTableConnectorService,
        @Inject(DATASOURCE_SERVICE) private datasourceService: IDatasourceService,
        @Inject(TABLE_SERVICE) public tableService: ITableService,
        @Inject(ROW_DRAG_DROP) public dragDropRowService: DragDropService,
        @Inject(LINES_SERVICE) private linesService: ILinesService,
        @Inject(SELECTION_SERVICE) private selectionService: ISelectionService,
        public columnsService: ColumnsService,
        public loadingService: LoadingService,
        private paginatorService: PaginatorService,
        private host: ElementRef<HTMLElement>,
        private scrollbarService: ScrollbarService,
        @Inject(SORT_SERVICE) private sortService: ISortService,
        @Optional() private filterService: FilterService,
    ) {
        this.dataSource = this.datasourceService.datasource;
        this.connectorService.connect(this);
        this.filterService?.register();
        this.scrollbarService.register(this.host.nativeElement);
    }

    @HostBinding('class.loading')
    get isLoadingClass() {
        return this.loadingService.loading();
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

    refresh() {
        this.linesService.refresh();
    }

    ngOnInit(): void {
        this.sortService.register(this.matSort);
    }

    ngAfterViewInit(): void {
        this.calculHeaderHeight();
    }

    ngOnDestroy(): void {
        this.ro?.disconnect();
        this.scrollbarService.unregister();
    }

    submit() {
        // TODO
    }

    private calculHeaderHeight() {
        const header = this.host.nativeElement.querySelector('.mat-mdc-header-row') as HTMLElement | null;
        if (!header) return;

        const update = () => (this.headerHeightPx = Math.ceil(header.getBoundingClientRect().height));

        update();
        this.ro = new ResizeObserver(update);
        this.ro.observe(header);
    }
}
