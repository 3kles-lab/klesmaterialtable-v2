import { Inject, Injectable, Optional } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { auditTime, catchError, concat, defer, map, Observable, of, switchMap, take } from 'rxjs';
import { SELECTION_CONFIG } from '../../../token';
import { SelectionAllResponse, SelectionConfig, SelectionResponse, SelectionState } from '../../../core/table/selection-config.interface';

@Injectable()
export class SelectionLoaderService<T> {
    constructor(@Optional() @Inject(SELECTION_CONFIG) private readonly selectionConfig: SelectionConfig<T> | undefined) {}

    public get key() {
        return this.selectionConfig?.key || '#select';
    }

    public select(row: FormGroup, selected: boolean, filters?: { [key: string]: any }): Observable<SelectionState> {
        return defer(() => this.selectionConfig?.params?.() || of({} as T)).pipe(
            auditTime(0),
            take(1),
            switchMap((params) => {
                const selection$: Observable<SelectionResponse> = this.selectionConfig?.select
                    ? this.selectionConfig.select(params, row, selected, filters)
                    : of({
                          selected,
                          count: undefined,
                      });

                const result$: Observable<SelectionState> = selection$.pipe(
                    map(
                        (response): SelectionState => ({
                            ...response,
                            loading: false,
                            success: true,
                        }),
                    ),
                    catchError(
                        (error): Observable<SelectionState> =>
                            of({
                                error,
                                loading: false,
                                success: false,
                            }),
                    ),
                );

                return concat(
                    of<SelectionState>({
                        loading: true,
                        success: false,
                    }),
                    result$,
                );
            }),
            catchError((error) =>
                of<SelectionState>({
                    error,
                    loading: false,
                    success: false,
                }),
            ),
        );
    }

    public selectAll(selected: boolean, filters?: { [key: string]: any }): Observable<SelectionState> {
        return defer(() => this.selectionConfig?.params?.() || of({} as T)).pipe(
            auditTime(0),
            take(1),
            switchMap((params) => {
                const selection$: Observable<SelectionAllResponse> = this.selectionConfig?.selectAll
                    ? this.selectionConfig.selectAll(params, selected, filters)
                    : of({
                          selected,
                          count: undefined,
                          footer: undefined,
                      });

                const result$: Observable<SelectionState> = selection$.pipe(
                    map(
                        (response): SelectionState => ({
                            ...response,
                            loading: false,
                            success: true,
                        }),
                    ),
                    catchError(
                        (error): Observable<SelectionState> =>
                            of({
                                error,
                                loading: false,
                                success: false,
                            }),
                    ),
                );

                return concat(
                    of<SelectionState>({
                        loading: true,
                        success: false,
                    }),
                    result$,
                );
            }),
            catchError((error) =>
                of<SelectionState>({
                    error,
                    loading: false,
                    success: false,
                }),
            ),
        );
    }
}
