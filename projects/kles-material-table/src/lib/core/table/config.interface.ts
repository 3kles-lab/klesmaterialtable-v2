import { Type } from '@angular/core';
import { AsyncValidatorFn, FormControlStatus, FormGroup, ValidatorFn } from '@angular/forms';
import { MatPaginatorIntl, MatPaginatorSelectConfig } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { ColumnSeparatorConfig, KlesColumnConfig } from './column.interface';
import { LinesLazyLoader, LinesLoader } from './loader.interface';
import { SelectionConfig } from './selection-config.interface';
import { KlesExtraCellFieldConfig, KlesStyleMap } from './cell.interface';
import { KlesTableIntl } from '../../components/table/table-intl';
import { Observable } from 'rxjs';

export type TableElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type RowClassValue = string | string[] | Set<string> | Record<string, boolean | null | undefined>;
export type RowStyleInput = KlesStyleMap | ((row: Record<string, unknown>, status: FormControlStatus, index: number) => KlesStyleMap);
export type RowClassInput = RowClassValue | ((row: Record<string, unknown>, status: FormControlStatus, index: number) => RowClassValue);

export interface RowAppearanceConfig {
    rowStyle?: RowStyleInput;
    rowClass?: RowClassInput;
}

export interface EmptyStateConfig {
    enabled?: boolean;
    component?: Type<unknown>;
    intl?: Type<KlesTableIntl>;
}

export interface DefaultTableConfig extends RowAppearanceConfig {
    id?: string;
    columns: KlesColumnConfig[];
    /** Reserved for row-level validation configuration; not applied yet. */
    lineValidations?: ValidatorFn[];
    /** Reserved for asynchronous row-level validation configuration; not applied yet. */
    lineAsyncValidations?: AsyncValidatorFn[];
    footer?: boolean;
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
    infinite?: boolean;
    /** Number of rows requested per page. Defaults to 10. */
    pageSize?: number;
    /** Distance, in pixels, from the bottom at which the next page is requested. Defaults to 200. */
    scrollThreshold?: number;
    /** Minimum delay, in milliseconds, between scroll checks. Defaults to 100. */
    scrollDebounceTime?: number;
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
        /** Restricts row dragging to the dedicated handle rendered in the first visible column. */
        handleOnly?: boolean;
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
    /** Reserved for the future column drag-and-drop implementation. */
    dragDropColumns?: DragDropConfig<TValue>;
}

export type ExtraRowMode = 'expand' | 'always';

export interface ExtraRowConfig {
    cells: KlesExtraCellFieldConfig[];
    mode?: ExtraRowMode;
    when?: (index: number, rowData: FormGroup) => boolean;
}

export interface ExtraRow {
    extraRows?: ExtraRowConfig[];
    /** Allows several expandable data rows to remain open. Defaults to false. */
    multiUnfold?: boolean;
}

export type LoaderConfig<T, R> = { lazy: true; lines: LinesLazyLoader<T, R> } | { lazy?: false | undefined; lines: LinesLoader<T, R> };

export type Selection<T> = {
    selection?: SelectionConfig<T>;
};

type Exclusive<T, U> =
    | (T & { [K in Exclude<keyof U, keyof T>]?: never })
    | (U & { [K in Exclude<keyof T, keyof U>]?: never });

export type KlesTableConfig<T = unknown, R = unknown> = DefaultTableConfig &
    Exclusive<PaginatorConfig, InfiniteScrollConfig> &
    LoaderConfig<T, R> &
    DragDrop<R> &
    Selection<T> &
    ExtraRow;
