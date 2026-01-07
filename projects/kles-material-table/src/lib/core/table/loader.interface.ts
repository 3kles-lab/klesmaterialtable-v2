import { Observable } from 'rxjs';
import { Query } from '../query/query.interface';

export type LoaderLazyResult<R> = Observable<{ total: number; items: R[] }>;
export type LoaderResult<R> = Observable<{ items: R[] }>;

type LinesLoaderDef<T, R> = {
    params?: () => Observable<T>;
    loader: (params: T) => LoaderResult<R>;
};

type LinesLazyLoaderDef<T, R> = {
    params?: () => Observable<T>;
    loader: (params: T, query?: Query) => LoaderLazyResult<R>;
};

type Brand<K extends string> = { readonly __brand: K };

export type LinesLoader<T, R> = LinesLoaderDef<T, R> & Brand<'LinesLoader'>;
export type LinesLazyLoader<T, R> = LinesLazyLoaderDef<T, R> & Brand<'LinesLazyLoader'>;

export const linesLoader = <T, R>(l: LinesLoaderDef<T, R>) => l as LinesLoader<T, R>;
export const linesLazyLoader = <T, R>(l: LinesLazyLoaderDef<T, R>) => l as LinesLazyLoader<T, R>;
