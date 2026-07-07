import { Injectable, Inject } from '@angular/core';

import { Subject, Observable, combineLatest, startWith, of, auditTime, switchMap, concat, catchError, map, shareReplay } from 'rxjs';
import { LOADER_CONFIG } from '../../../token';
import { IChildrensLoader } from './loader.interface';
import { LoaderConfig } from '../../../core/table/config.interface';
import { LinesLoader } from '../../../core/table/loader.interface';
import { FormGroup } from '@angular/forms';

@Injectable()
export class LoaderChildrensService<T, R> implements IChildrensLoader<R> {
    private _refresh$ = new Subject<void>();

    constructor(@Inject(LOADER_CONFIG) private readonly loaderConfig: LoaderConfig<T, R>) {}

    public load(parent: FormGroup<any>, depth: number): Observable<{ total: number; items: R[]; loading: boolean; error?: any }> {
        const linesLoader = this.loaderConfig.lines as LinesLoader<T, R>;
        return combineLatest([this._refresh$.pipe(startWith(void 0)), linesLoader.params?.() || of({} as T)]).pipe(
            auditTime(0),
            switchMap(([_, params]) => {
                return concat(
                    of({ loading: true, total: 0, items: [] }),
                    (linesLoader.childrens?.(params, parent, depth) ?? of({ items: [] })).pipe(
                        catchError((err) => {
                            return of({ error: err, items: [] });
                        }),
                        map((response) => {
                            return { ...response, loading: false, total: response?.items.length || 0 };
                        }),
                    ),
                );
            }),
        );
    }

    public refresh() {
        this._refresh$.next();
    }
}
