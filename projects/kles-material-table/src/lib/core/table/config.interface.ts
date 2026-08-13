import { Type } from '@angular/core';
import { AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';
import { MatPaginatorIntl, MatPaginatorSelectConfig } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ColumnSeparatorConfig, KlesColumnConfig } from './column.interface';
import { LinesLazyLoader, LinesLoader } from './loader.interface';
import { SelectionConfig } from './selection-config.interface';
import { KlesExtraCellFieldConfig } from './cell.interface';
import { KlesTableIntl } from '../../components/table/table-intl';

export type TableElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface EmptyStateConfig {
    enabled?: boolean;
    component?: Type<unknown>;
    intl?: Type<KlesTableIntl>;
}

export interface DefaultTableConfig {
    id?: string;
    columns: KlesColumnConfig[];
    lineValidations?: ValidatorFn[]; //TODO
    lineAsyncValidations?: AsyncValidatorFn[]; //TODO
    footer?: boolean; //TODO
    sortConfig?: Sort;
    columnSeparator?: boolean | ColumnSeparatorConfig;
    elevation?: TableElevationLevel;
    emptyState?: boolean | EmptyStateConfig;
}

export interface PaginatorConfig {
    paginator?: boolean;
    customMatPaginatorIntl?: Type<MatPaginatorIntl>;
    pageSize?: number;
    pageSizeOptions?: number[];
    showFirstLastButtons?: boolean;
    selectConfig?: MatPaginatorSelectConfig;
}

export interface InfiniteScrollConfig {
    infinite?: boolean; //TODO
}

export interface DragDropConfig {
    enable?: boolean;
    options?: {
        autoScrollStep?: number;
        connectedTo?: string[];
        dragDisabled?: (row: FormGroup) => boolean; //TODO
        dragPreview?: {
            //TODO
            matchSize?: boolean;
            component: Type<any>;
        };
        dragPlaceholder?: {
            //TODO
            component: Type<any>;
        };
    };
}

export interface DragDrop {
    dragDropRows?: DragDropConfig;
    drapDropColumns?: DragDropConfig; //TODO
}

export type ExtraRowMode = 'expand' | 'always';

export interface ExtraRowConfig {
    cells: KlesExtraCellFieldConfig[];
    mode?: ExtraRowMode;
    when?: (index: number, rowData: FormGroup) => boolean;
}

export interface ExtraRow {
    extraRows?: ExtraRowConfig[];
    multiUnfold?: boolean;
}

export type LoaderConfig<T, R> = { lazy: true; lines: LinesLazyLoader<T, R> } | { lazy?: false | undefined; lines: LinesLoader<T, R> };

export type Selection<T> = {
    selection?: SelectionConfig<T>;
};

type Exclusive<T, U> = (T & { [K in keyof U]?: never }) | (U & { [K in keyof T]?: never });

export type KlesTableConfig<T = any, R = any> = DefaultTableConfig &
    Exclusive<PaginatorConfig, InfiniteScrollConfig> &
    LoaderConfig<T, R> &
    DragDrop &
    Selection<T> &
    ExtraRow;
