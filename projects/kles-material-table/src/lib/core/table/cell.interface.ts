import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { Type } from '@angular/core';
import { FormArray, FormControlStatus, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { Span } from '../../enums/span.enum';

type B = Omit<IKlesFieldConfig, 'name'>;
type C = Omit<IKlesFieldConfig, 'name' | 'value'>;

export type NgStyleInput =
    | Record<string, any>
    | ((value?: any, status?: FormControlStatus, row?: Record<string, any>, rowStatus?: FormControlStatus) => Record<string, string | any>);

interface IStyle {
    ngStyle?: NgStyleInput;
}

export interface IKlesHeaderFieldConfig extends B {
    filterComponent?: Type<any>; //filter component for header
    filterClearable?: boolean; //active button to clear filter
    filterPredicate?: (value: any, filter: any) => boolean; //override default predicate only for this field
    sortPredicate?: (data: any) => string | number; //override default sort predicate only for this field
    style?: IStyle;
}

export interface IKlesCellFieldConfig extends C {
    executeAfterChange?: (property?: string, row?: any, group?: FormGroup<any> | FormArray<any>) => Observable<any>;
    style?: IStyle;
}

export interface IKlesFooterFieldConfig extends B {
    style?: IStyle;
}

export interface KlesExtraCellFieldConfig extends IKlesCellFieldConfig {
    columnDef: string;
    colspan?: number | Span;
    rowspan?: number;
}
