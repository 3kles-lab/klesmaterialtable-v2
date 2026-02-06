import { SortHeaderArrowPosition } from '@angular/material/sort';
import { AlignCell } from '../../enums/align.enum';
import { IKlesCellFieldConfig, IKlesFooterFieldConfig, IKlesHeaderFieldConfig } from './cell.interface';
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
    sortArrowPosition?: SortHeaderArrowPosition;
    resizable?: boolean; //TODO
    headerCell: IKlesHeaderFieldConfig;
    cell: IKlesCellFieldConfig;
    footerCell?: IKlesFooterFieldConfig; //TODO
    canUnfold?: boolean; //TODO
    align?: AlignCell;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
}
