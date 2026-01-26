import { Inject, Injectable, Optional } from '@angular/core';
import { IKlesSelectionModel } from '../../../core/selection/selection-model.interface';
import { SELECTION_KEY } from '../../../token';
import { concat, delay, Observable, of } from 'rxjs';

@Injectable()
export class SelectionService<T> {
    constructor(
        @Inject(SELECTION_KEY) public readonly key: string, // @Optional() @Inject(SELECTION_MODEL) protected selectionModel: IKlesSelectionModel<T>,
    ) {}

    public selectAll(): Observable<{ loading: boolean }> {
        return concat(of({ loading: true }), of({ loading: false }).pipe(delay(2000)));
    }
}
