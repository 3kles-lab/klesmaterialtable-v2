import { Type } from '@angular/core';
import { AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { LinesLazyLoader, LinesLoader } from './loader.interface';
import { KlesColumnConfig } from './column.interface';

export interface IDefaultTableConfig {
    id?: string;
    columns: KlesColumnConfig[];
    lineValidations?: ValidatorFn[];
    lineAsyncValidations?: AsyncValidatorFn[];
    footer?: boolean;
    sortConfig?: Sort;
    selectionMode?: boolean;
}

export interface IPaginatorConfig {
    paginator?: boolean;
    customMatPaginatorIntl?: Type<MatPaginatorIntl>;
    pageSize?: number;
    pageSizeOptions?: number[];
}

export interface IInfiniteScrollConfig {
    infinite?: boolean;
}

export interface IDragDropConfig {
    enable?: boolean;
    options?: {
        autoScrollStep?: number;
        connectedTo?: string[];
        dragDisabled?: (row: FormGroup) => boolean;
        dragPreview?: {
            matchSize?: boolean;
            component: Type<any>;
        };
        dragPlaceholder?: {
            component: Type<any>;
        };
    };
}

export type IDragDrop = {
    dragDropRows?: IDragDropConfig;
    drapDropColumns?: IDragDropConfig;
};

export type ILoader<T, R> = { lazy: true; lines: LinesLazyLoader<T, R> } | { lazy?: false | undefined; lines: LinesLoader<T, R> };

type Exclusive<T, U> = (T & { [K in keyof U]?: never }) | (U & { [K in keyof T]?: never });

export type KlesTableConfig<T = any, R = any> = IDefaultTableConfig & Exclusive<IPaginatorConfig, IInfiniteScrollConfig> & ILoader<T, R> & IDragDrop;
