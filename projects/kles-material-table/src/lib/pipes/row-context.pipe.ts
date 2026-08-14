import { inject, Pipe, PipeTransform, Signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { KlesRowContext } from '../core/table/row-context.interface';
import { RowContextStore } from '../services/store/row-context-store.service';

@Pipe({
    name: 'rowContext',
    standalone: true,
    pure: true,
})
export class RowContextPipe implements PipeTransform {
    private readonly store = inject(RowContextStore);

    transform(row: AbstractControl | null | undefined): Signal<KlesRowContext | null> | null {
        return row ? this.store.get(row) : null;
    }
}
