import { KlesColumnConfig } from '../table/column.interface';

export interface ColumnApi {
    getVisible(): string[];
    setVisible(columnDef: string, visible: boolean): void;
    toggleVisible(columnDef: string): void;
    changeWidth(columnDef: string, options: { width?: string; maxWidth?: string; minWidth?: string }): void;
    setResizable(columnDef: string, resizable: boolean): void;
    toggleResizable(columnDef: string): void;
    setSticky(columnDef: string, options: { sticky?: boolean; stickyEnd?: boolean }): void;
    columns(): KlesColumnConfig[];
    setColumnPosition(columnDef: string, position: number): void;
}
