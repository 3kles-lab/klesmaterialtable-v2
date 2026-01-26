import { DataSource } from '@angular/cdk/table';
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Observable } from 'rxjs';

// interface ICrudDataSource {
//     addRecord(record: any, options?: { index?: number; emitEvent?: boolean }): FormGroup;
//     removeById(id: string, options?: { emitEvent?: boolean }): boolean;
//     removeAt(index: number, options?: { emitEvent?: boolean }): boolean;
//     updateRecord(id: string, record: any, options?: { emitEvent?: boolean }): FormGroup;
//     clearRows(options?: { emitEvent?: boolean }): void;
// }

// interface IColumn {
//     changeColumnVisibility(columnDef: string, visible: boolean): void;
//     toggleColumnVisibility(columnDef: string): void;
// }

// interface IHelperDataSource {
//     // getRowById(id: string): FormGroup | null;
//     // getRowAt(index: number): FormGroup | null;
// }

export interface IKlesDataSource extends DataSource<FormGroup> {
    set data(data: any[]);
    get paginator(): MatPaginator | null | undefined;
    set paginator(paginator: MatPaginator | null | undefined);
    get sort(): MatSort | null | undefined;
    set sort(sort: MatSort | null | undefined);
    connect(): Observable<readonly FormGroup[]>;
}


// export type IKlesDataSource = IDataSource & IHelperDataSource & ICrudDataSource & IColumn;
