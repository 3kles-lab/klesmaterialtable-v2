import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { RefreshOptions } from '../../../core/api/table';
import { Pagination } from '../../../core/query/query.interface';

export interface LoaderResponse<R> {
    total: number;
    items: R[];
    loading: boolean;
    showLoading?: boolean;
    error?: unknown;
    header?: Record<string, unknown>;
}

export interface LazyLoaderResponse<R> extends LoaderResponse<R> {
    pagination?: Pagination;
}

export interface ILoader<R> {
    load(): Observable<LoaderResponse<R>>;
    refresh(options?: RefreshOptions): void;
}

export interface IChildrensLoader<R> {
    load(parent: FormGroup, depth: number): Observable<{ total: number; items: R[]; loading: boolean; error?: unknown; header?: Record<string, unknown> }>;
    refresh(): void;
}
