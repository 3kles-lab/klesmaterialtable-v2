import type { Observable } from 'rxjs';
import type { Query } from '../query/query.interface';
import type { RowId } from './selection-config.interface';

export type RowUpdated<TRow> = {
    type: 'updated';
    id: RowId;
    changes: Partial<TRow>;
};

export type TableDataChange<TRow> =
    | RowUpdated<TRow>
    | { type: 'created'; row?: TRow }
    | { type: 'deleted'; id: RowId }
    | { type: 'invalidate' };

export interface LiveUpdatesConfig<TRow> {
    /** Supplies data changes for this table. The subscription is scoped to the table's lifetime. */
    events: () => Observable<TableDataChange<TRow>>;
    /** Return false to apply the update to the loaded row. Defaults to reloading in both modes. */
    shouldRefresh?: (event: RowUpdated<TRow>, query: Readonly<Query>) => boolean;
}
