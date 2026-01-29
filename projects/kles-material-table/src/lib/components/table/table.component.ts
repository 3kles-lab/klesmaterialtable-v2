import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostBinding, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { CdkDrag, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { DragDropService } from '../../services/features/dragdrop/dragdrop.service';
import { ROW_DRAG_DROP, TABLE_SERVICE } from '../../token';
import { ResolveNgStylePipe } from '../../pipes/ng-style.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResizableColumnDirective } from '../../directives/resizable-column.directive';
import { ScrollbarService } from '../../services/features/scrollbar/scrollbar.service';

import { ScrollbarApi } from '../../core/api/scrollbar';
import { KlesTableConnectorService } from '../../kles-table-connector.service';
import { ColumnApi } from '../../core/api/column';
import { ColumnsService } from '../../services/features/columns/columns.service';
import { PaginationApi } from '../../core/api/pagination';
import { ITableService } from '../../services/features/table/abstract-table.service';

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
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    headerHeightPx = 56;
    private ro?: ResizeObserver;

    dataSource: any;

    constructor(
        private connectorService: KlesTableConnectorService,
        @Inject(TABLE_SERVICE) public tableService: ITableService,
        @Inject(ROW_DRAG_DROP) public dragDropRowService: DragDropService,
        public columnsService: ColumnsService,
        private host: ElementRef<HTMLElement>,
        private scrollbarService: ScrollbarService,
    ) {
        this.connectorService.connect(this);
        this.scrollbarService.register(this.host.nativeElement);
    }

    @HostBinding('class.loading')
    get isLoadingClass() {
        return this.tableService.loading();
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
        };
    }

    get pagination(): PaginationApi {
        return {
            setPageIndex: (index) => this.tableService.setPageIndex(index),
            setPageSize: (size) => this.tableService.setPageSize(size),
            firstPage: () => this.tableService.firstPage(),
            lastPage: () => this.tableService.lastPage(),
        };
    }

    refresh() {
        this.tableService.refresh();
    }

    ngOnInit(): void {
        this.tableService.sort = this.sort;
    }

    ngAfterViewInit(): void {
        this.calculHeaderHeight();
    }

    ngOnDestroy(): void {
        this.ro?.disconnect();
        this.scrollbarService.unregister();
    }

    submit() {
        if (this.dataSource.form.invalid) return;
        console.log(this.dataSource.form.value.rows);
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
