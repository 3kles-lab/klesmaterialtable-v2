import { Component, ComponentRef, Inject, input, OnInit } from '@angular/core';
import { DynamicTableLoaderDirective } from './directives/dynamic-table-loader.directive';
import { KlesTableConfig } from './core/table/config.interface';
import { ITable } from './core/table/table.interface';
import { KlesTableManagerService, KlesTableService } from './kles-table.service';

@Component({
    selector: 'kles-dynamic-table',
    templateUrl: './kles-table.component.html',
    standalone: true,
    imports: [DynamicTableLoaderDirective],
    providers: [KlesTableManagerService, KlesTableService],
    styleUrl: './kles-table.component.scss'
})
export class KlesTableComponent implements OnInit {
    tableConfig = input.required<KlesTableConfig>();

    constructor(public tableService: KlesTableService, private managerService: KlesTableManagerService) {}

    ngOnInit(): void {}

    protected onCreated(ref: ComponentRef<ITable>) {
        this.managerService.table = ref?.instance;
    }
}
