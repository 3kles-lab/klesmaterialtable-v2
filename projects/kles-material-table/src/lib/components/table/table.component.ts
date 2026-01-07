import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTable, MatTableModule } from '@angular/material/table';

import { IKlesDataSource } from '../../core/datasource/datasource.interface';
import { KLES_DATA_SOURCE } from './datasource';
import { ITable } from '../../core/table/table.interface';
import { COLUMNS, ROW_DRAG_DROP } from '../../core/table/token';
import { KlesColumnConfig } from '../../core/table/column.interface';
import { CdkTableModule } from '@angular/cdk/table';
import { KlesMaterialDynamicformsModule } from '@3kles/kles-material-dynamicforms';
import { HeaderFieldPipe } from '../../pipes/header-field.pipe';
import { CellFieldPipe } from '../../pipes/cell-field.pipe';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DragDropService } from '../../services/features/dragdrop/dragdrop.service';

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
    ],
})
export class TableComponent implements ITable, OnInit {
    @ViewChild(MatTable) table!: MatTable<FormGroup>;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    displayedColumns: string[];

    constructor(
        @Inject(KLES_DATA_SOURCE) public dataSource: IKlesDataSource,
        @Inject(COLUMNS) public columns: KlesColumnConfig[],
        @Inject(ROW_DRAG_DROP) public dragDropRowService: DragDropService,
    ) {
        this.setDisplayedColums();
    }
   
    ngOnInit(): void {
        this.dataSource.sort = this.sort;
    }

    private setDisplayedColums() {
        this.displayedColumns = this.columns.filter((c) => c.visible !== false).map((c) => c.columnDef);
    }

    submit() {
        if (this.dataSource.form.invalid) return;
        console.log(this.dataSource.form.value.rows);
    }

}
