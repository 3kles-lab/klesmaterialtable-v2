import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

import { PageEvent } from '@angular/material/paginator';
import { SortDirection } from '@angular/material/sort';

export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count';

export interface SortPayload {
    active: string;
    direction: SortDirection;
}

/**
 * Payload de base pour une ligne.
 *
 * row      = le FormGroup de la ligne
 * value    = row.value, donc sans les champs disabled
 * rawValue = row.getRawValue(), donc avec les champs disabled
 */
export interface RowPayload<TValue = unknown> {
    row: FormGroup;
    rowIndex: number;
    value: Partial<TValue>;
    rawValue: TValue;
}

export interface RowMousePayload<TValue = unknown> extends RowPayload<TValue> {
    event: MouseEvent;
}

export interface RowActionClickPayload<TValue = unknown> extends RowPayload<TValue> {
    actionKey: string;
    event?: MouseEvent;
}

export interface BulkActionClickPayload<TValue = unknown> {
    actionKey: string;
    selectedRows: FormGroup[];
    selectedValues: Partial<TValue>[];
    selectedRawValues: TValue[];
    selectedCount: number;
    event?: MouseEvent;
}

/**
 * Payload de base pour une cellule.
 */
export interface CellPayload<TValue = unknown> {
    row: FormGroup;
    rowIndex: number;

    columnDef: string;
    control: AbstractControl | null;

    value: unknown;
    rawValue: TValue;

    event?: Event;
}

export interface CellMousePayload<TValue = unknown> extends CellPayload<TValue> {
    event: MouseEvent;
}

export interface CellValueChangePayload<TValue = unknown> {
    row: FormGroup;
    rowIndex: number;

    columnDef: string;
    control: AbstractControl;

    previousValue: unknown;
    currentValue: unknown;

    value: Partial<TValue>;
    rawValue: TValue;
}

/**
 * Sélection.
 */
export interface SelectionChangePayload<TValue = unknown> {
    selectedRows: FormGroup[];
    selectedValues: Partial<TValue>[];
    selectedRawValues: TValue[];

    selectedCount: number;

    addedRows?: FormGroup[];
    removedRows?: FormGroup[];

    allSelected?: boolean;
}

export interface LoadingChangePayload {
    loading: boolean;
}

export interface VisibilityChangePayload {
    visible: boolean;
}

export interface EmptyStateChangePayload {
    enabled: boolean;
}

/**
 * Pagination.
 */
export interface PageChangePayload {
    pageIndex: number;
    previousPageIndex?: number;
    pageSize: number;
    totalItems?: number;

    sourceEvent?: PageEvent;
}

/**
 * Filtres / recherche.
 */
export interface FilterChangePayload {
    filters: Record<string, unknown>;

    changedFilter?: {
        columnDef: string;
        previousValue: unknown;
        currentValue: unknown;
    };
}

export interface GlobalSearchPayload {
    search: string;
}

/**
 * Colonnes.
 */
export interface ColumnPayload {
    columnDef: string;
}

export interface ColumnResizePayload {
    columnDef: string;
    width: number;
    previousWidth?: number;
}

export interface ColumnOrderChangePayload {
    previousIndex: number;
    currentIndex: number;
    columns: string[];
}

export interface ColumnVisibilityChangePayload {
    columnDef: string;
    visible: boolean;
    columns: string[];
}

/**
 * Drag & drop.
 */
export interface RowDropPayload<TValue = unknown> extends RowPayload<TValue> {
    previousIndex: number;
    currentIndex: number;
    previousContainerId?: string;
    currentContainerId?: string;
}

export interface ColumnDropPayload {
    columnDef: string;
    previousIndex: number;
    currentIndex: number;
}

/**
 * Expansion / tree.
 */
export interface ExpansionPayload<TValue = unknown> extends RowPayload<TValue> {
    level?: number;
}

export interface TreePayload<TValue = unknown> extends RowPayload<TValue> {
    level: number;
}

/**
 * Lazy loading.
 */

export interface LoadSuccessPayload<TValue = unknown> {
    rows: FormGroup[];
    values: Partial<TValue>[];
    rawValues: TValue[];
    total?: number;
}

export interface LoadErrorPayload {
    error: unknown;
    message?: string;
}

/**
 * État / vue.
 */
export interface StateChangePayload {
    columns: string[];
    filters: Record<string, unknown>;
    sort?: SortPayload;
    pageIndex?: number;
    pageSize?: number;
}

/**
 * Footer / résumé.
 */
export interface SummaryChangePayload {
    columnDef: string;
    value: unknown;
    aggregation: AggregationType;
}

/**
 * Validation.
 */
export interface RowValidatePayload<TValue = unknown> extends RowPayload<TValue> {
    valid: boolean;
    invalid: boolean;
    errors: ValidationErrors | null;
    controlsErrors: Record<string, ValidationErrors | null>;
}

export interface ValidationErrorPayload<TValue = unknown> {
    row?: FormGroup;
    rowIndex?: number;

    columnDef?: string;
    control?: AbstractControl | null;

    value?: Partial<TValue>;
    rawValue?: TValue;

    errors: ValidationErrors | null;
    controlsErrors?: Record<string, ValidationErrors | null | undefined>;
}
