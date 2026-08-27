import { Subject } from 'rxjs';
import { IKlesSelectionModel } from './selection-model.interface';
import { getMultipleValuesInSingleSelectionError } from './selection-model-error';
import { KlesSelectionModelState } from './selection-state.enum';
import { Signal, signal } from '@angular/core';

export class KlesSelectionModel<T> implements IKlesSelectionModel<T> {
    private _selection = new Set<T>();
    private _changed = new Subject<{ added?: T[]; removed?: T[]; count: number; state: KlesSelectionModelState }>();
    private _stateChanged = new Subject<KlesSelectionModelState>();
    private _state: KlesSelectionModelState = KlesSelectionModelState.ENABLED;

    private _count = signal<number>(0);

    constructor(
        private readonly multiple: boolean = false,
        initialValues?: T[],
    ) {
        const values = initialValues ?? [];
        this.assertSelectionCardinality(values);
        values.forEach((value) => this._selection.add(value));
        this._count.set(this._selection.size);
    }

    get selected(): { items: T[]; count: number; state: KlesSelectionModelState } {
        return {
            items: Array.from(this._selection),
            count: this._selection.size,
            state: this._state,
        };
    }

    get count(): Signal<number> {
        return this._count.asReadonly();
    }

    get changed() {
        return this._changed.asObservable();
    }

    get state() {
        return this._state;
    }

    get stateChanged() {
        return this._stateChanged.asObservable();
    }

    get selectionMode() {
        return this.multiple;
    }

    public select(value: T | T[], options?: { emitEvent?: boolean }): void {
        const added = [];
        const removed = [];
        if (this._state === KlesSelectionModelState.ENABLED) {
            if (Array.isArray(value)) {
                this.assertSelectionCardinality(value);
                if (!this.multiple && value.length === 1) {
                    const singleValue = value[0];
                    if (!this.isSelected(singleValue)) {
                        removed.push(...Array.from(this._selection));
                        this._selection.clear();
                        this._selection.add(singleValue);
                        added.push(singleValue);
                    }
                } else {
                    value.forEach((v) => {
                        if (!this.isSelected(v)) {
                            this._selection.add(v);
                            added.push(v);
                        }
                    });
                }
            } else {
                if (!this.isSelected(value)) {
                    if (!this.multiple) {
                        removed.push(...Array.from(this._selection));
                        this._selection.clear();
                    }
                    this._selection.add(value);
                    added.push(value);
                }
            }
        }

        this._count.set(this._selection.size);
        if ((options?.emitEvent ?? true) && (added.length > 0 || removed.length > 0)) {
            this._changed.next({ added, removed, count: this._selection.size, state: this._state });
        }
    }

    public deselect(value: T | T[], options?: { emitEvent?: boolean }): void {
        const removed: T[] = [];
        const added: T[] = [];
        if (this._state === KlesSelectionModelState.ENABLED) {
            if (Array.isArray(value)) {
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

        this._count.set(this._selection.size);
        if ((options?.emitEvent ?? true) && (added.length > 0 || removed.length > 0)) {
            this._changed.next({ added, removed, count: this._selection.size, state: this._state });
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
        this._state = KlesSelectionModelState.DISABLED;
        this._stateChanged.next(this._state);
    }
    public enable(): void {
        this._state = KlesSelectionModelState.ENABLED;
        this._stateChanged.next(this._state);
    }

    public isSelected(value: T): boolean {
        return this._selection.has(this.getValue(value));
    }

    public isMultipleSelection(): boolean {
        return this.multiple || false;
    }

    public reset(values: T[], options?: { emitEvent?: boolean }): void {
        this.assertSelectionCardinality(values);
        const previous = Array.from(this._selection);

        this._selection.clear();

        values.forEach((value) => this._selection.add(value));

        this._count.set(this._selection.size);

        if (options?.emitEvent ?? true) {
            this._changed.next({
                added: values.filter((value) => !previous.includes(value)),
                removed: previous.filter((value) => !this._selection.has(value)),
                count: this._selection.size,
                state: this._state,
            });
        }
    }

    private getValue(value: T) {
        // si jamais je rajoute une méthode de comparaison avec _selection
        return value;
    }

    private assertSelectionCardinality(values: T[]): void {
        if (!this.multiple && values.length > 1) {
            throw getMultipleValuesInSingleSelectionError();
        }
    }
}
