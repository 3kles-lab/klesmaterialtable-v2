import { CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { TableComponent } from '../table/table.component';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaginatorStore } from '../../services/store/paginator-store.service';
import { ITable } from '../../core/table/table.interface';
import { IKlesDataSource } from '../../core/datasource/datasource.interface';
import { KLES_DATA_SOURCE } from '../table/datasource';

@Component({
    selector: 'kles-paginate-table',
    templateUrl: './paginate-table.component.html',
    styleUrl: './paginate-table.component.scss',
    standalone: true,
    imports: [CommonModule, TableComponent, MatPaginatorModule],
})
export class PaginateTableComponent implements OnInit, ITable {
    @ViewChild(MatPaginator, { static: true }) private paginator: MatPaginator;
    @ViewChild(TableComponent, { static: true }) table: TableComponent;
    @ViewChild(TableComponent, { read: ElementRef }) tableRef!: ElementRef<HTMLElement>;

    constructor(private paginatorStore: PaginatorStore, @Inject(KLES_DATA_SOURCE) public dataSource: IKlesDataSource) {}

    ngOnInit(): void {
        this.paginator.pageIndex = this.paginatorStore.snapshot().page;
        this.paginator.pageSize = this.paginatorStore.snapshot().perPage;
        this.paginator.pageSizeOptions = this.paginatorStore.pageSizeOptions;
        this.table.dataSource.paginator = this.paginator;
    }

    onPage(e: PageEvent) {
        this.tableRef?.nativeElement?.scrollTo({ top: 0, behavior: 'instant' });
    }
}
