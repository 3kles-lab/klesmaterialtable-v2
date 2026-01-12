import { Injectable } from '@angular/core';
import { ITable } from './core/table/table.interface';
import { FormGroup } from '@angular/forms';

@Injectable()
export class KlesTableManagerService {
    private _table: ITable;

    public set table(table: ITable) {
        this._table = table;
    }

    public get table() {
        return this._table;
    }
}

@Injectable()
export class KlesTableService {
    constructor(private manager: KlesTableManagerService) {}

    public addRecord(record: any, options?: { index?: number; emitEvent?: boolean }):FormGroup {
        return this.manager.table?.dataSource.addRecord(record, options);
    }

    public updateRecord(id: string, record: any, options?: { emitEvent?: boolean }): FormGroup {
        return this.manager.table?.dataSource.updateRecord(id, record, options);
    }

    public removeById(id: string, options?: { emitEvent?: boolean }): boolean {
        return this.manager.table?.dataSource.removeById(id, options) || false;
    }
    public removeAt(index: number, options?: { emitEvent?: boolean }): boolean {
        return this.manager.table?.dataSource.removeAt(index, options) || false;
    }
    public clearRows(options?: { emitEvent?: boolean }): void {
        this.manager.table?.dataSource.clearRows(options);
    }

    public changeColumnVisibility(columnDef: string, visible: boolean): void {
        this.manager.table?.dataSource.changeColumnVisibility(columnDef, visible);
    }

    public toggleColumnVisibility(columnDef: string): void {
        this.manager.table?.dataSource.toggleColumnVisibility(columnDef);
    }

    //TODO mettre toutes mes methodes pour interragir avec le tableau
}
