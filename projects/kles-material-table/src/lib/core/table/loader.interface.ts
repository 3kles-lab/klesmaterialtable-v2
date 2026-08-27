import { Observable } from 'rxjs';
import { Query } from '../query/query.interface';
import { FormGroup } from '@angular/forms';

type LoaderCallback<TArgs extends unknown[], TResult> = {
    bivarianceHack(...args: TArgs): TResult;
}['bivarianceHack'];

export type LoaderLazyResult<R> = Observable<{ total: number; items: R[]; header?: { [key: string]: unknown } }>;
export type LoaderResult<R> = Observable<{ items: R[] }>;

type LinesLoaderDef<T, R, C> = {
    params?: () => Observable<T>;
    loader: LoaderCallback<[params: T], LoaderResult<R>>;
    hasChildren?: LoaderCallback<[parent: FormGroup, depth: number], boolean>;
    childrens?: LoaderCallback<[params: T, parent: FormGroup, depth: number], LoaderResult<C>>;
};

type LinesLazyLoaderDef<T, R, C> = {
    params?: () => Observable<T>;
    loader: LoaderCallback<[params: T, query?: Query], LoaderLazyResult<R>>;
    hasChildren?: LoaderCallback<[parent: FormGroup, depth: number], boolean>;
    childrens?: LoaderCallback<[params: T, parent: FormGroup, depth: number, query?: Query], LoaderLazyResult<C>>;
};

type Brand<K extends string> = { readonly __brand: K };

export type LinesLoader<T, R, C = R> = LinesLoaderDef<T, R, C> & Brand<'LinesLoader'>;
export type LinesLazyLoader<T, R, C = R> = LinesLazyLoaderDef<T, R, C> & Brand<'LinesLazyLoader'>;

export const linesLoader = <T, R, C = R>(l: LinesLoaderDef<T, R, C>) => l as LinesLoader<T, R, C>;
export const linesLazyLoader = <T, R, C = R>(l: LinesLazyLoaderDef<T, R, C>) => l as LinesLazyLoader<T, R, C>;
