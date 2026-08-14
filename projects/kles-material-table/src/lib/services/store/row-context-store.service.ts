import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { KlesRowContext } from '../../core/table/row-context.interface';

@Injectable()
export class RowContextStore {
    private readonly contexts = new WeakMap<AbstractControl, WritableSignal<KlesRowContext<unknown> | null>>();

    set<TSource>(row: AbstractControl, context: KlesRowContext<TSource>): void {
        const current = this.contexts.get(row);

        if (current) {
            current.set(context as KlesRowContext<unknown>);
        } else {
            this.contexts.set(row, signal<KlesRowContext<unknown> | null>(context));
        }
    }

    get<TSource = unknown>(row: AbstractControl): Signal<KlesRowContext<TSource> | null> | null {
        return (this.contexts.get(row) as Signal<KlesRowContext<TSource> | null> | undefined) ?? null;
    }

    updateSource<TSource>(row: AbstractControl, source: TSource): void {
        this.contexts.get(row)?.update((context) =>
            context
                ? {
                      ...context,
                      source,
                  }
                : null,
        );
    }

    delete(row: AbstractControl): void {
        this.contexts.delete(row);
    }
}
