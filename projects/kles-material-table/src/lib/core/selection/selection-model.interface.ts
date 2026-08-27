import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { KlesSelectionModelState } from './selection-state.enum';

export interface IKlesSelectionModel<T> {
    readonly count: Signal<number>;
    readonly changed: Observable<{ added?: T[]; removed?: T[]; count: number; state: KlesSelectionModelState }>;
    readonly stateChanged: Observable<KlesSelectionModelState>;
    readonly selected: { items: T[]; count: number; state: KlesSelectionModelState };
    readonly state: KlesSelectionModelState;
    readonly selectionMode: boolean;

    select(value: T | T[], options?: { emitEvent?: boolean }): void;
    deselect(value: T | T[], options?: { emitEvent?: boolean }): void;
    toggle(value: T, options?: { emitEvent?: boolean }): void;
    reset(values: T[], options?: { emitEvent?: boolean }): void;
    isSelected(value: T): boolean;
    isMultipleSelection(): boolean;
    isEmpty(): boolean;
    hasValue(): boolean;

    disable(): void;
    enable(): void;
}
