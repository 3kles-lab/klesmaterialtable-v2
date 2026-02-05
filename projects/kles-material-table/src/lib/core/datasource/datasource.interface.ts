import { DataSource } from '@angular/cdk/table';
import { FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Observable } from 'rxjs';

export interface IKlesDataSource extends DataSource<FormGroup> {
    set data(data: any[]);
    get paginator(): MatPaginator | null | undefined;
    set paginator(paginator: MatPaginator | null | undefined);
    get sort(): MatSort | null | undefined;
    set sort(sort: MatSort | null | undefined);
    get filter(): string;
    set filter(f: string);
    connect(): Observable<readonly FormGroup[]>;
}
