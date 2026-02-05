import { KlesColumnConfig } from '../table/column.interface';

export interface ColumnApi {
    setVisible(columnDef: string, visible: boolean): void;
    toggleVisible(columnDef: string): void;
    changeWidth(columnDef: string, options: { width?: string; maxWidth?: string; minWidth?: string }): void;
    setResizable(columnDef: string, resizable: boolean);
    toggleResizable(columnDef: string);
    setSticky(columnDef: string, options: { sticky?: boolean; stickyEnd?: boolean });
    columns(): KlesColumnConfig[];
    setColumnPosition: (columnDef, position: number) => void;
}
