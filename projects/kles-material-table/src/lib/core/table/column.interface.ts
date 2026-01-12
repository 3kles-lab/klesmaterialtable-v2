import { AlignCell } from '../../enums/align.enum';
import { IKlesCellFieldConfig, IKlesHeaderFieldConfig } from './cell.interface';
import { Signal } from '@angular/core';

export interface KlesColumnConfig {
    columnDef: string;
    sticky?: boolean;
    stickyEnd?: boolean;
    visible?: boolean;
    visibleWhen?: Signal<boolean>;
    disabled?: boolean;
    name?: string;
    ngClass?: any;
    filterable?: boolean;
    sortable?: boolean;
    resizable?: boolean;
    headerCell: IKlesHeaderFieldConfig;
    cell: IKlesCellFieldConfig;
    footerCell?: IKlesCellFieldConfig;
    canUnfold?: boolean;
    align?: AlignCell;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
}
