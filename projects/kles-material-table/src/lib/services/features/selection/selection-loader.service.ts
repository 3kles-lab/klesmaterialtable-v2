import { Inject, Injectable, Optional } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { auditTime, catchError, concat, map, Observable, of, switchMap, take } from 'rxjs';
import { SELECTION_CONFIG } from '../../../token';
import { SelectionConfig } from '../../../core/table/selection-config.interface';

@Injectable()
export class SelectionLoaderService<T> {
    constructor(@Optional() @Inject(SELECTION_CONFIG) private readonly selectionConfig: SelectionConfig<T> | undefined) {}

    public get key() {
        return this.selectionConfig?.key || '#select';
    }

    public select(
        row: FormGroup,
        selected: boolean,
        filters?: { [key: string]: any },
    ): Observable<{ loading: boolean; success: boolean; selected?: boolean; footer?: any; count?: number }> {
        return (this.selectionConfig?.params?.() || of({} as T)).pipe(
            auditTime(0),
            take(1),
            switchMap((params) => {
                return concat(
                    of({ loading: true, success: false }),
                    (this.selectionConfig?.select
                        ? this.selectionConfig?.select?.(params, row, selected, filters)
                        : of({ selected, count: null as number })
                    ).pipe(
                        map((response) => {
                            return { ...response, loading: false, success: true };
                        }),
                        catchError((err) => {
                            return of({ error: err, loading: false, success: false });
                        }),
                    ),
                );
            }),
        );
    }

    public selectAll(
        selected: boolean,
        filters?: { [key: string]: any },
    ): Observable<{ loading: boolean; success: boolean; selected?: boolean; footer?: any; count?: number }> {
        return (this.selectionConfig?.params?.() || of({} as T)).pipe(
            auditTime(0),
            take(1),
            switchMap((params) => {
                return concat(
                    of({ loading: true, success: false }),
                    (this.selectionConfig?.selectAll
                        ? this.selectionConfig?.selectAll?.(params, selected, filters)
                        : of({ selected, count: null as number, footer: null })
                    ).pipe(
                        map((response) => {
                            return { ...response, loading: false, success: true };
                        }),
                        catchError((err) => {
                            return of({ error: err, loading: false, success: false });
                        }),
                    ),
                );
            }),
        );
    }
}
