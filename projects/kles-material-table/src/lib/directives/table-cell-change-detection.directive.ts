import { ChangeDetectorRef, Directive, inject, Input, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { KlesDynamicFieldDirective } from '@3kles/kles-material-dynamicforms';
import { Subscription } from 'rxjs';

@Directive({
    selector: '[klesDynamicField][klesTableCellControl]',
})
export class TableCellChangeDetectionDirective implements OnDestroy {
    private readonly dynamicField = inject(KlesDynamicFieldDirective, { self: true });
    private changes?: Subscription;

    @Input({ required: true }) set klesTableCellControl(control: AbstractControl) {
        this.changes?.unsubscribe();
        this.changes = control.valueChanges.subscribe(() => {
            // Mark the field component's own view via its injector.
            this.dynamicField.componentRef?.injector.get(ChangeDetectorRef).markForCheck();
        });
    }

    ngOnDestroy(): void {
        this.changes?.unsubscribe();
    }
}
