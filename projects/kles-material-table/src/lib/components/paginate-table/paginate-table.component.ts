import { CommonModule } from '@angular/common';
import { Component, OnInit, Signal, ViewChild } from '@angular/core';
import { TableComponent } from '../table/table.component';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { PaginatorService } from '../../services/features/paginator/paginator.service';

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

    disabled: Signal<boolean>;

    constructor(private paginatorService: PaginatorService) {
        this.disabled = paginatorService.disabled();
    }

    ngOnInit(): void {
        this.paginatorService.register(this.paginator);
    }
}
