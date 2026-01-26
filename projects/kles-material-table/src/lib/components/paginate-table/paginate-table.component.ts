import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { TableComponent } from '../table/table.component';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TABLE_SERVICE } from '../../token';
import { ITableService } from '../../services/features/table/table.service';

@Component({
    selector: 'kles-paginate-table',
    templateUrl: './paginate-table.component.html',
    styleUrl: './paginate-table.component.scss',
    standalone: true,
    imports: [CommonModule, TableComponent, MatPaginatorModule],
})
export class PaginateTableComponent implements OnInit {
    @ViewChild(MatPaginator, { static: true }) private paginator: MatPaginator;
    @ViewChild(TableComponent, { static: true }) table: TableComponent;

    constructor(@Inject(TABLE_SERVICE) public tableService: ITableService) {}

    ngOnInit(): void {
        this.tableService.paginator = this.paginator;
    }

    onPage(e: PageEvent) {
        this.table?.scrollbar.toTop('instant');
    }
}
