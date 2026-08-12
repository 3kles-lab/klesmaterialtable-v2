import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

export type RowId = string | number;

export interface SelectionResponse {
    selected: boolean;
    count?: number;
}

export interface SelectionAllResponse extends SelectionResponse {
    footer?: any;
}

export interface SelectionState {
    loading: boolean;
    success: boolean;
    selected?: boolean;
    footer?: any;
    count?: number;
    error?: unknown;
}

type SelectionConfigDef<T> = {
    selectionMode?: boolean;
    key?: string;
    params?: () => Observable<T>;
    select?: (params: T, row: FormGroup, selected: boolean, filters?: { [key: string]: any }) => Observable<SelectionResponse>;
    selectAll?: (params: T, selected: boolean, filters?: { [key: string]: any }) => Observable<SelectionAllResponse>;

    /** optionnel */
    /** pour indiquer le critère des lignes déja sélectionné */
    isSelected?: (row: FormGroup) => boolean;
    isDisabled?: (row: FormGroup) => boolean;
};

type Brand<K extends string> = { readonly __brand: K };

export type SelectionConfig<T> = SelectionConfigDef<T> & Brand<'SelectionConfig'>;
export const selectionConfig = <T>(l: SelectionConfigDef<T>) => l as SelectionConfig<T>;
