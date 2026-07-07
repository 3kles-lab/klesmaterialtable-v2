import {
    CellMousePayload,
    CellValueChangePayload,
    ColumnDropPayload,
    ColumnOrderChangePayload,
    ColumnPayload,
    ColumnResizePayload,
    ColumnVisibilityChangePayload,
    ExpansionPayload,
    FilterChangePayload,
    LazyQueryChangePayload,
    LoadErrorPayload,
    LoadSuccessPayload,
    PageChangePayload,
    RowDropPayload,
    RowMousePayload,
    RowPayload,
    SortPayload,
    TreePayload,
    ValidationErrorPayload,
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

    rowCreate: RowPayload<TValue>; //TODO
    rowUpdate: RowPayload<TValue>; //TODO
    rowPatch: RowPayload<TValue>; //TODO
    rowDelete: RowPayload<TValue>; //TODO

    /**
     * cell
     */
    cellClick: CellMousePayload<TValue>;
    cellDoubleClick: CellMousePayload<TValue>;
    cellContextMenu: CellMousePayload<TValue>;
    cellValueChange: CellValueChangePayload<TValue>;

    //   /**
    //    * Sélection
    //    */
    //   selectionChange: SelectionChangePayload<TValue>;
    //   rowSelect: RowPayload<TValue>;
    //   rowUnselect: RowPayload<TValue>;

    //   selectAll: SelectionChangePayload<TValue>;
    //   unselectAll: SelectionChangePayload<TValue>;
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
    rowDragStart: RowPayload<TValue>; //TODO
    rowDragMove: RowPayload<TValue>; //TODO
    rowDragEnd: RowPayload<TValue>; //TODO
    rowDrop: RowDropPayload<TValue>; //TODO

    columnDragStart: ColumnPayload; //TODO
    columnDragEnd: ColumnPayload; //TODO
    columnDrop: ColumnDropPayload; //TODO

    /**
     * Expansion / tree
     */
    rowExpand: ExpansionPayload<TValue>; //TODO
    rowCollapse: ExpansionPayload<TValue>; //TODO
    rowToggleExpand: ExpansionPayload<TValue>; //TODO

    expandAll: void; //TODO
    collapseAll: void; //TODO

    nodeExpand: TreePayload<TValue>; //TODO
    nodeCollapse: TreePayload<TValue>; //TODO
    nodeLoadChildren: TreePayload<TValue>; //TODO
    nodeChildrenLoaded: TreePayload<TValue>; //TODO

    /**
     * Loading / lazy
     */
    loadStart: void; //TODO
    loadSuccess: LoadSuccessPayload<TValue>; //TODO
    loadError: LoadErrorPayload; //TODO
    loadCancel: void; //TODO

    reload: void; //TODO
    refresh: void; //TODO

    lazyQueryChange: LazyQueryChangePayload; //TODO

    /**
     * Error / validation
     */
    error: LoadErrorPayload; //TODO

    validationError: ValidationErrorPayload<TValue>; //TODO
    rowValidationError: ValidationErrorPayload<TValue>; //TODO
    cellValidationError: ValidationErrorPayload<TValue>; //TODO
}
