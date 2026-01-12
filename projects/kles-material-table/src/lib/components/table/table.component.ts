import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostBinding, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTable, MatTableModule } from '@angular/material/table';

import { IKlesDataSource } from '../../core/datasource/datasource.interface';
import { KLES_DATA_SOURCE } from './datasource';
import { ITable } from '../../core/table/table.interface';

import { CdkTableModule } from '@angular/cdk/table';
import { KlesMaterialDynamicformsModule } from '@3kles/kles-material-dynamicforms';
import { HeaderFieldPipe } from '../../pipes/header-field.pipe';
import { CellFieldPipe } from '../../pipes/cell-field.pipe';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DragDropService } from '../../services/features/dragdrop/dragdrop.service';
import { ROW_DRAG_DROP } from '../../token';
import { ColumnsService } from '../../services/features/columns/columns.service';
import { ResolveNgStylePipe } from '../../pipes/ng-style.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
    ],
})
export class TableComponent implements ITable, OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatTable) table!: MatTable<FormGroup>;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild('wrap', { static: true }) wrap!: ElementRef<HTMLElement>;

    headerHeightPx = 56;
    private ro?: ResizeObserver;

    constructor(
        @Inject(KLES_DATA_SOURCE) public dataSource: IKlesDataSource,
        public columnsService: ColumnsService,
        @Inject(ROW_DRAG_DROP) public dragDropRowService: DragDropService,
    ) {}

    @HostBinding('class.loading')
    get isLoadingClass() {
        return this.dataSource.loading();
    }

    ngOnInit(): void {
        this.dataSource.sort = this.sort;
    }

    ngAfterViewInit(): void {
        this.calculHeaderHeight();
    }

    ngOnDestroy(): void {
        this.ro?.disconnect();
    }

    submit() {
        if (this.dataSource.form.invalid) return;
        console.log(this.dataSource.form.value.rows);
    }

    private calculHeaderHeight() {
        const header = this.wrap.nativeElement.querySelector('.mat-mdc-header-row') as HTMLElement | null;
        if (!header) return;

        const update = () => (this.headerHeightPx = Math.ceil(header.getBoundingClientRect().height));

        update();
        this.ro = new ResizeObserver(update);
        this.ro.observe(header);
    }
}
