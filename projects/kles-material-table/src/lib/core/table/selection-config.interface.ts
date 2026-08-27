import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

type SelectionCallback<TArgs extends unknown[], TResult> = {
    bivarianceHack(...args: TArgs): TResult;
}['bivarianceHack'];

export type RowId = string | number;

export interface SelectionResponse {
    selected: boolean;
    count?: number;
}

export interface SelectionAllResponse extends SelectionResponse {
    footer?: unknown;
}

export interface SelectionState {
    loading: boolean;
    success: boolean;
    selected?: boolean;
    footer?: unknown;
    count?: number;
    error?: unknown;
}

type SelectionConfigDef<T> = {
    selectionMode?: boolean;
    key?: string;
    params?: () => Observable<T>;
    select?: SelectionCallback<
        [params: T, row: FormGroup, selected: boolean, filters?: Record<string, unknown>],
        Observable<SelectionResponse>
    >;
    selectAll?: SelectionCallback<
        [params: T, selected: boolean, filters?: Record<string, unknown>],
        Observable<SelectionAllResponse>
    >;

    /** Resolves the initial selected state of a row. */
    isSelected?: (row: FormGroup) => boolean;
    /** Resolves whether selection must remain disabled for a row. */
    isDisabled?: (row: FormGroup) => boolean;
};

type Brand<K extends string> = { readonly __brand: K };

export type SelectionConfig<T> = SelectionConfigDef<T> & Brand<'SelectionConfig'>;
export const selectionConfig = <T>(l: SelectionConfigDef<T>) => l as SelectionConfig<T>;
