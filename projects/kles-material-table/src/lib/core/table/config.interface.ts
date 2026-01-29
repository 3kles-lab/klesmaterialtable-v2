import { Type } from '@angular/core';
import { AsyncValidatorFn, FormGroup, ValidatorFn } from '@angular/forms';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { KlesColumnConfig } from './column.interface';
import { LinesLazyLoader, LinesLoader } from './loader.interface';

export interface IDefaultTableConfig {
    id?: string;
    columns: KlesColumnConfig[];
    lineValidations?: ValidatorFn[]; //TODO
    lineAsyncValidations?: AsyncValidatorFn[]; //TODO
    footer?: boolean; //TODO
    sortConfig?: Sort;
    selectionMode?: boolean; //TODO
}

export interface IPaginatorConfig {
    paginator?: boolean;
    customMatPaginatorIntl?: Type<MatPaginatorIntl>;
    pageSize?: number;
    pageSizeOptions?: number[];
}

export interface IInfiniteScrollConfig {
    infinite?: boolean; //TODO
}

export interface IDragDropConfig {
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

export type IDragDrop = {
    dragDropRows?: IDragDropConfig;
    drapDropColumns?: IDragDropConfig; //TODO
};

export type ILoaderConfig<T, R> = { lazy: true; lines: LinesLazyLoader<T, R> } | { lazy?: false | undefined; lines: LinesLoader<T, R> };

type Exclusive<T, U> = (T & { [K in keyof U]?: never }) | (U & { [K in keyof T]?: never });

export type KlesTableConfig<T = any, R = any> = IDefaultTableConfig &
    Exclusive<IPaginatorConfig, IInfiniteScrollConfig> &
    ILoaderConfig<T, R> &
    IDragDrop;
