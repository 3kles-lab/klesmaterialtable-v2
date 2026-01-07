import { Component, input, OnInit } from '@angular/core';
import { DynamicTableLoaderDirective } from './directives/dynamic-table-loader.directive';
import { KlesTableConfig } from './core/table/config.interface';

@Component({
    selector: 'kles-dynamic-table',
    templateUrl: './kles-table.component.html',
    standalone: true,
    imports: [DynamicTableLoaderDirective],
})
export class KlesTableComponent implements OnInit {
    tableConfig = input.required<KlesTableConfig>();

    ngOnInit(): void {}
}
