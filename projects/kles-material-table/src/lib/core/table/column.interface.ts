import { SortHeaderArrowPosition } from '@angular/material/sort';
import { AlignCell } from '../../enums/align.enum';
import { IKlesCellFieldConfig, IKlesFooterFieldConfig, IKlesHeaderFieldConfig } from './cell.interface';
import { Signal } from '@angular/core';

export type ColumnSeparatorStyle = 'solid' | 'dashed' | 'dotted' | 'double';
export type ColumnClass = string | string[] | Set<string> | Record<string, boolean | null | undefined>;

export interface ColumnSeparatorConfig {
    color?: string;
    width?: string;
    style?: ColumnSeparatorStyle;
    header?: boolean;
    body?: boolean;
    footer?: boolean;
    showAfterLastColumn?: boolean;
}

export interface KlesColumnConfig {
    columnDef: string;
    sticky?: boolean;
    stickyEnd?: boolean;
    visible?: boolean;
    visibleWhen?: Signal<boolean>;
    disabled?: boolean;
    ngClass?: ColumnClass;
    filterable?: boolean;
    sortable?: boolean;
    sortArrowPosition?: SortHeaderArrowPosition;
    resizable?: boolean; //TODO
    headerCell?: IKlesHeaderFieldConfig;
    cell?: IKlesCellFieldConfig;
    footerCell?: IKlesFooterFieldConfig; //TODO
    align?: AlignCell;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    canExpand?: boolean;
    canExpandNode?: boolean;
    separator?: boolean | ColumnSeparatorConfig;
}
