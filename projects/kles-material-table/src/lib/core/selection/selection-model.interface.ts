import { Observable } from 'rxjs';
import { KlesSelectionModelState } from './selection-state.enum';

export interface IKlesSelectionModel<T> {
    select(value: T | T[], options?: { emitEvent?: boolean }): void;
    deselect(value: T | T[], options?: { emitEvent?: boolean }): void;
    toggle(value: T, options?: { emitEvent?: boolean }): void;
    isEmpty(): boolean;
    hasValue(): boolean;

    disable(): void;
    enable(): void;

    get selected(): { items?: T[]; count: number; state: KlesSelectionModelState };
    get changed(): Observable<{ added?: T[]; removed?: T[]; count: number; state: KlesSelectionModelState }>;
    get state(): KlesSelectionModelState;
}
