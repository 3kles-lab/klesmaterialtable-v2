import { IKlesFieldConfig } from '@3kles/kles-material-dynamicforms';
import { Type } from '@angular/core';
import { KlesColumnConfig } from './column.interface';
import { FormArray, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

type B = Omit<IKlesFieldConfig, 'name'>;

export interface IKlesHeaderFieldConfig extends B {
    filterComponent?: Type<any>; //filter component for header
    filterClearable?: boolean; //active button to clear filter
    filterPredicate?: (value: any, filter: any) => boolean; //override default predicate only for this field
    sortPredicate?: (data: any) => string | number; //override default sort predicate only for this field
}

export interface IKlesCellFieldConfig extends B {
    executeAfterChange?: (property?: string, row?: any, group?: FormGroup<any> | FormArray<any>) => Observable<any>;
}
