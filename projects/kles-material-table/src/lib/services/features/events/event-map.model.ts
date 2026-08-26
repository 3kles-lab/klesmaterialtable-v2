import {
    CellMousePayload,
    CellValueChangePayload,
    ColumnOrderChangePayload,
    ColumnResizePayload,
    ColumnVisibilityChangePayload,
    ExpansionPayload,
    FilterChangePayload,
    EmptyStateChangePayload,
    LoadErrorPayload,
    LoadSuccessPayload,
    PageChangePayload,
    RowDropPayload,
    RowMousePayload,
    RowPayload,
    SortPayload,
    SelectionChangePayload,
    TreePayload,
    ValidationErrorPayload,
    LoadingChangePayload,
    VisibilityChangePayload,
} from './event-payloads.model';

export interface TableEventMap<TValue = unknown> {
    /**
     * row
     */
    rowClick: RowMousePayload<TValue>;
    rowDoubleClick: RowMousePayload<TValue>;
    rowContextMenu: RowMousePayload<TValue>;
    rowMouseEnter: RowMousePayload<TValue>;
    rowMouseLeave: RowMousePayload<TValue>;

    rowCreate: RowPayload<TValue>;
    rowUpdate: RowPayload<TValue>;
    rowPatch: RowPayload<TValue>;
    rowDelete: RowPayload<TValue>;

    /**
     * cell
     */
    cellClick: CellMousePayload<TValue>;
    cellDoubleClick: CellMousePayload<TValue>;
    cellContextMenu: CellMousePayload<TValue>;
    cellValueChange: CellValueChangePayload<TValue>;

    /**
     * Sélection
     */
    selectionChange: SelectionChangePayload<TValue>;
    rowSelect: RowPayload<TValue>;
    rowUnselect: RowPayload<TValue>;
    selectAll: SelectionChangePayload<TValue>;
    unselectAll: SelectionChangePayload<TValue>;

    //   selectionClear: SelectionChangePayload<TValue>;
    //   selectionInvert: SelectionChangePayload<TValue>;

    /**
     * pagination
     */
    pageChange: PageChangePayload;

    /**
     * sort
     */
    sortChange: SortPayload;

    /**
     * filters
     */
    filterChange: FilterChangePayload;

    /**
     * columns
     */
    columnResize: ColumnResizePayload;
    columnResizeStart: ColumnResizePayload;
    columnResizeEnd: ColumnResizePayload;
    columnOrderChange: ColumnOrderChangePayload;
    columnVisibilityChange: ColumnVisibilityChangePayload;

    /**
     * Drag & drop
     */
    rowDragStart: RowPayload<TValue>;
    rowDragMove: RowPayload<TValue>;
    rowDragEnd: RowPayload<TValue>;
    rowDrop: RowDropPayload<TValue>;

    /**
     * Expansion / tree
     */
    rowExpand: ExpansionPayload<TValue>;
    rowCollapse: ExpansionPayload<TValue>;
    rowToggleExpand: ExpansionPayload<TValue>;

    nodeExpand: TreePayload<TValue>;
    nodeCollapse: TreePayload<TValue>;
    nodeLoadChildren: TreePayload<TValue>;
    nodeChildrenLoaded: TreePayload<TValue>;

    /**
     * Loading / lazy
     */
    loadStart: void;
    loadSuccess: LoadSuccessPayload<TValue>;
    loadError: LoadErrorPayload;

    refresh: void;

    /**
     * États d'affichage
     */
    loadingChange: LoadingChangePayload;
    footerVisibilityChange: VisibilityChangePayload;
    emptyStateChange: EmptyStateChangePayload;

    /**
     * Error / validation
     */

    rowValidationError: ValidationErrorPayload<TValue>;
    cellValidationError: ValidationErrorPayload<TValue>;
}
