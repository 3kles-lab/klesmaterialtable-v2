import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

export interface ILoader<R> {
    load(): Observable<{ total: number; items: R[]; loading: boolean; error?: unknown; header?: Record<string, unknown> }>;
    refresh(): void;
}

export interface IChildrensLoader<R> {
    load(parent: FormGroup, depth: number): Observable<{ total: number; items: R[]; loading: boolean; error?: unknown; header?: Record<string, unknown> }>;
    refresh(): void;
}
