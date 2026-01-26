import { Observable } from 'rxjs';
import { KlesSelectionModelState } from './selection-state.enum';

export interface IKlesSelectionModel<T> {
    select(value: T | T[], options?: { emitEvent?: boolean }): Observable<any>;
    deselect(value: T | T[], options?: { emitEvent?: boolean }): Observable<any>;
    isEmpty(): boolean;
    hasValue(): boolean;

    disable(): void;
    enable(): void;

    get selected(): { items?: T[]; count: number; state: KlesSelectionModelState };
    get changed(): Observable<{ added?: T[]; removed?: T[]; count: number; state: KlesSelectionModelState }>;
    get state(): KlesSelectionModelState;
}
