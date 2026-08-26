import { Injectable } from '@angular/core';
import { ITable } from './core/table/table.interface';
import { ScrollbarApi } from './core/api/scrollbar';
import { ColumnApi } from './core/api/column';
import { PaginationApi } from './core/api/pagination';
import { SortApi } from './core/api/sort';
import { LoadingApi } from './core/api/loading';
import { SelectionApi } from './core/api/selection';
import { FooterApi } from './core/api/footer';
import { ArrayUiState, GroupUiState } from '@3kles/kles-material-dynamicforms';
import { EventsApi } from './core/api/events';
import { BehaviorSubject, Observable } from 'rxjs';
import { EmptyStateApi } from './core/api/empty-state';
import { RenderApi } from './core/api/render';
import { TreeApi } from './core/api/tree';

@Injectable()
export class KlesTableConnectorService {
    private _connected$ = new BehaviorSubject<boolean>(false);
    private _table?: ITable;

    public readonly connected$: Observable<boolean> = this._connected$.asObservable();

    constructor() {}

    public connect(table: ITable) {
        this._table = table;
        this._connected$.next(true);
        return () => {
            if (this._table === table) {
                this._table = undefined;
                this._connected$.next(false);
            }
        };
    }

    public get table(): ITable {
        if (!this._table) {
            throw new Error('KlesTableConnectorService: table is not connected');
        }

        return this._table;
    }

    get scrollbar(): ScrollbarApi {
        return this.table.scrollbar;
    }

    get column(): ColumnApi {
        return this.table?.column;
    }

    get pagination(): PaginationApi | undefined {
        return this.table.pagination;
    }

    get sort(): SortApi {
        return this.table.sort;
    }

    get loading(): LoadingApi {
        return this.table.loading;
    }

    get selection(): SelectionApi {
        return this.table.selection;
    }

    get footer(): FooterApi {
        return this.table.footer;
    }

    get form() {
        return this.table.form;
    }

    get ui(): GroupUiState<{
        header: GroupUiState;
        rows: ArrayUiState;
        footer: GroupUiState;
    }> {
        return this.table.ui;
    }

    get events(): EventsApi {
        return this.table.events;
    }

    get emptyState(): EmptyStateApi {
        return this.table.emptyState;
    }

    get render(): RenderApi {
        return this.table.render;
    }

    get tree(): TreeApi {
        return this.table.tree;
    }

    public refresh() {
        this.table?.refresh();
    }
}
