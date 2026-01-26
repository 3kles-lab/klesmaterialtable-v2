import { Injectable } from '@angular/core';
import { ITable } from './core/table/table.interface';
import { ScrollbarService } from './services/features/scrollbar/scrollbar.service';
import { ScrollbarApi } from './core/api/scrollbar';
import { ColumnApi } from './core/api/column';
import { PaginationApi } from './core/api/pagination';

@Injectable()
export class KlesTableConnectorService {
    private table?: ITable;

    constructor() {}

    public connect(table: ITable) {
        this.table = table;
        return () => {
            if (this.table === table) {
                this.table = undefined;
            }
        };
    }

    get scrollbar(): ScrollbarApi {
        return this.table?.scrollbar;
    }

    get column(): ColumnApi {
        return this.table.column;
    }

    get record() {
        return null;
    }

    get pagination(): PaginationApi | undefined{
        return this.table?.pagination;
    }

    public refresh() {
        this.table.refresh();
    }

    // public addRecord(record: any, options?: { index?: number; emitEvent?: boolean }): FormGroup {
    // return this.manager.table?.tableService.addRecord(record, options);
    // }

    // public updateRecord(id: string, record: any, options?: { emitEvent?: boolean }): FormGroup {
    //     return this.manager.table?.dataSource.updateRecord(id, record, options);
    // }

    // public removeRecordById(id: string, options?: { emitEvent?: boolean }): boolean {
    //     return this.manager.table?.dataSource.removeById(id, options) || false;
    // }
    // public removeRecordAt(index: number, options?: { emitEvent?: boolean }): boolean {
    //     return this.manager.table?.dataSource.removeAt(index, options) || false;
    // }
    // public clearRows(options?: { emitEvent?: boolean }): void {
    //     this.manager.table?.dataSource.clearRows(options);
    // }

    // public changeColumnVisibility(columnDef: string, visible: boolean): void {
    //     this.manager.table?.dataSource.changeColumnVisibility(columnDef, visible);
    // }

    public toggleColumnVisibility(columnDef: string): void {
        // this.manager.table?.dataSource.toggleColumnVisibility(columnDef);
    }
}
