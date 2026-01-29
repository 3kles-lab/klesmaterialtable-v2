import { Component, Inject, OnInit } from '@angular/core';
import { ITable } from '../../core/table/table.interface';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../table/table.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { TABLE_SERVICE } from '../../token';
import { ITableService } from '../../services/features/table/abstract-table.service';

@Component({
    selector: 'kles-infinite-scroll-table',
    templateUrl: './infinite-scroll-table.component.html',
    // styleUrl: './paginate-table.component.scss',
    standalone: true,
    imports: [CommonModule, TableComponent, ScrollingModule],
})
export class InfiniteScrollTableComponent implements OnInit {
    constructor(@Inject(TABLE_SERVICE) public tableService: ITableService) {}

    ngOnInit(): void {}
}
