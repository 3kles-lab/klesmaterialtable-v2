import { Observable, of, Subject } from 'rxjs';
import { IKlesSelectionModel } from './selection-model.interface';
import { getMultipleValuesInSingleSelectionError } from './selection-model-error';
import { KlesSelectionModelState } from './selection-state.enum';

export class KlesSelectionModel<T> implements IKlesSelectionModel<T> {
    private _selection = new Set<T>();
    private _changed = new Subject<{ added?: T[]; removed?: T[]; count: number; state: KlesSelectionModelState }>();
    private _stateChanged = new Subject<KlesSelectionModelState>();
    private _state: KlesSelectionModelState = KlesSelectionModelState.ENABLED;

    constructor(
        private multiple: boolean = false,
        initialValues?: T[],
    ) {
        initialValues?.forEach((v) => {
            this._selection.add(v);
        });
    }

    get selected(): { items: T[]; count: number; state: KlesSelectionModelState } {
        return {
            items: Array.from(this._selection),
            count: this._selection.size,
            state: this._state,
        };
    }

    get changed() {
        return this._changed.asObservable();
    }

    get state() {
        return this._state;
    }

    public select(value: T | T[], options?: { emitEvent?: boolean }): void {
        const added = [];
        if (this._state === KlesSelectionModelState.ENABLED) {
            if (Array.isArray(value)) {
                if (value.length > 1 && !this.multiple) {
                    throw getMultipleValuesInSingleSelectionError();
                }

                value.forEach((v) => {
                    if (!this.isSelected(v)) {
                        this._selection.add(v);
                        added.push(v);
                    }
                });
            } else {
                if (!this.isSelected(value)) {
                    if (!this.multiple) {
                        this._selection.clear();
                    }
                    this._selection.add(value);
                    added.push(value);
                }
            }
        }

        if (options?.emitEvent) {
            this._changed.next({ added, removed: [], count: this._selection.size, state: this._state });
        }
    }

    public deselect(value: T | T[], options?: { emitEvent?: boolean }): void {
        const removed = [];
        if (this._state === KlesSelectionModelState.ENABLED) {
            if (Array.isArray(value)) {
                if (value.length > 1 && !this.multiple) {
                    throw getMultipleValuesInSingleSelectionError();
                }

                value.forEach((v) => {
                    if (this.isSelected(v)) {
                        this._selection.delete(v);
                        removed.push(v);
                    }
                });
            } else {
                if (this.isSelected(value)) {
                    this._selection.delete(value);
                    removed.push(value);
                }
            }
        }

        if (options?.emitEvent) {
            this._changed.next({ added: [], removed, count: this._selection.size, state: this._state });
        }
    }

    public toggle(value: T, options?: { emitEvent?: boolean }): void {
        if (this.isSelected(value)) {
            this.deselect(value, options);
        } else {
            this.select(value, options);
        }
    }

    public isEmpty(): boolean {
        return this._selection.size === 0;
    }

    public hasValue(): boolean {
        return this._selection.size > 0;
    }

    public disable(): void {
        this._state = KlesSelectionModelState.ENABLED;
        this._stateChanged.next(this._state);
    }
    public enable(): void {
        this._state = KlesSelectionModelState.DISABLED;
        this._stateChanged.next(this._state);
    }

    public isSelected(value: T): boolean {
        return this._selection.has(this.getValue(value));
    }

    private getValue(value: T) {
        // si jamais je rajoute une méthode de comparaison avec _selection
        return value;
    }
}
