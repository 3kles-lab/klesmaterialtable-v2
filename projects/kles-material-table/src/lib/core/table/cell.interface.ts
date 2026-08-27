import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { FormArray, FormControlStatus, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { Span } from '../../enums/span.enum';

type B = Omit<IKlesFieldConfig, 'name'>;
type C = Omit<IKlesFieldConfig, 'name' | 'value'>;

export type KlesStyleValue = string | number | null | undefined;
export type KlesStyleMap = Record<string, KlesStyleValue>;
export type NgStyleInput =
    | KlesStyleMap
    | ((value?: unknown, status?: FormControlStatus, row?: Record<string, unknown>, rowStatus?: FormControlStatus) => KlesStyleMap);

interface IStyle {
    ngStyle?: NgStyleInput;
}

export interface IKlesHeaderFieldConfig {
    field?: B;
    label?: string;
    tooltip?: string;
    /** Displays the action used to clear this column's filter. */
    filterClearable?: boolean;
    /** Overrides the default filter predicate for this column. */
    filterPredicate?: (value: unknown, filter: unknown) => boolean;
    /** Overrides the default sorting value for this column. */
    sortPredicate?: (data: FormGroup) => string | number;
    style?: IStyle;
}

export interface IKlesCellFieldConfig {
    executeAfterChange?: (property?: string, row?: unknown, group?: FormGroup | FormArray) => Observable<unknown>;
    style?: IStyle;
    field?: C;
}

export interface IKlesFooterFieldConfig {
    style?: IStyle;
    field: B;
}

export interface KlesExtraCellFieldConfig extends IKlesCellFieldConfig {
    columnDef: string;
    colspan?: number | Span;
    rowspan?: number;
}
