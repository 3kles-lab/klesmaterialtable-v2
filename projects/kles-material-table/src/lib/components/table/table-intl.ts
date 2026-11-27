import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class KlesTableIntl {
    /** Emits after the labels change so rendered tables can refresh them. */
    readonly changes = new Subject<void>();

    emptyStateTitle = 'No data';
    emptyStateDescription = 'There are no rows to display.';
    emptyStateRefreshLabel = 'Refresh';
    keyboardNavigationEntryLabel = 'Go to table rows';
    expandRowLabel = 'Expand row';
    collapseRowLabel = 'Collapse row';
    moveRowLabel = 'Move row';
    clearFilterLabel = 'Clear';
    moveColumnLabel = (columnLabel: string): string => `Move column ${columnLabel}`;
    resizeColumnLabel = (columnDef: string): string => `Redimensionner la colonne ${columnDef}`;
    loadingMoreRowsLabel = 'Loading more rows';
}
