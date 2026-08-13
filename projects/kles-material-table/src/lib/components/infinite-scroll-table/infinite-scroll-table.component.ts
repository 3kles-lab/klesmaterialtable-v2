import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
    selector: 'kles-infinite-scroll-table',
    templateUrl: './infinite-scroll-table.component.html',
    // styleUrl: './paginate-table.component.scss',
    standalone: true,
    imports: [CommonModule, ScrollingModule],
})
export class InfiniteScrollTableComponent implements OnInit {
    constructor() {}

    ngOnInit(): void {}
}
