import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

export interface ILoader<R> {
    load(): Observable<{ total: number; items: R[]; loading: boolean; error?: any; header?: any }>;
    refresh(): void;
}

export interface IChildrensLoader<R> {
    load(parent: FormGroup<any>, depth: number): Observable<{ total: number; items: R[]; loading: boolean; error?: any; header?: any }>;
    refresh(): void;
}
