import { Type } from '@angular/core';
import { AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';
import { MatPaginatorIntl, MatPaginatorSelectConfig } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ColumnSeparatorConfig, KlesColumnConfig } from './column.interface';
import { LinesLazyLoader, LinesLoader } from './loader.interface';
import { SelectionConfig } from './selection-config.interface';
import { KlesExtraCellFieldConfig } from './cell.interface';
import { KlesTableIntl } from '../../components/table/table-intl';
import { Observable } from 'rxjs';

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

export interface DragDropRowChange<TValue = unknown> extends DragDropRowContext<TValue> {
    previousIndex: number;
    currentIndex: number;
    previousContainerId?: string;
    currentContainerId?: string;
    parentId?: string | number | null;
    depth?: number;
    previousSiblingIndex?: number;
    currentSiblingIndex?: number;
    movedRows?: FormGroup[];
    movedRawValues?: TValue[];
}

export interface DragDropConfig<TValue = unknown> {
    enable?: boolean;
    options?: {
        autoScrollStep?: number;
        connectedTo?: string[];
        dragDisabled?: (row: FormGroup) => boolean;
        drop?: (change: DragDropRowChange<TValue>) => Observable<unknown>;
        dragPreview?: {
            matchSize?: boolean;
            component: Type<unknown>;
        };
        dragPlaceholder?: {
            component: Type<unknown>;
        };
    };
}

export interface DragDropRowContext<TValue = unknown> {
    row: FormGroup;
    rowIndex: number;
    value: Partial<TValue>;
    rawValue: TValue;
}

export interface DragDrop<TValue = unknown> {
    dragDropRows?: DragDropConfig<TValue>;
    dragDropColumns?: DragDropConfig<TValue>; //TODO
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
    DragDrop<R> &
    Selection<T> &
    ExtraRow;
