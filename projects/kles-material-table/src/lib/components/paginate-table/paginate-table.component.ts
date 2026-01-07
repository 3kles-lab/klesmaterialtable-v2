import { CommonModule } from '@angular/common';
import { Component, OnInit, Optional, ViewChild } from '@angular/core';
import { TableComponent } from '../table/table.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { PaginatorStore } from '../../services/store/paginator-store.service';

@Component({
    selector: 'kles-paginate-table',
    templateUrl: './paginate-table.component.html',
    standalone: true,
    imports: [CommonModule, TableComponent, MatPaginatorModule],
})
export class PaginateTableComponent implements OnInit {
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(TableComponent, { static: true }) table: TableComponent;

    constructor(private paginatorStore: PaginatorStore) {}

    ngOnInit(): void {
        this.paginator.pageIndex = this.paginatorStore.snapshot().page;
        this.paginator.pageSize = this.paginatorStore.snapshot().perPage;

        this.table.dataSource.paginator = this.paginator;
    }
}
