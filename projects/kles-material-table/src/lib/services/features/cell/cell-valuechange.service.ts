import { DestroyRef, inject, Injectable } from '@angular/core';
import { EventsService } from '../events/events.service';
import { Subscription } from 'rxjs';
import { AbstractControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export class CellValueChangeService {
    private readonly destroyRef = inject(DestroyRef);

    private readonly subscriptions = new Map<string, Subscription>();

    constructor(private readonly eventsService: EventsService) {}

    public refresh(visibleRows: FormGroup[], visibleColumns: string[]): void {
        const expectedKeys = new Set<string>();
        visibleRows.forEach((row, rowIndex) => {
            visibleColumns.forEach((column) => {
                const columnKey = column;
                const control = row.get(columnKey);

                if (!control) {
                    return;
                }

                const key = this.getCellKey(row, columnKey);
                expectedKeys.add(key);

                if (this.subscriptions.has(key)) {
                    return;
                }

                const subscription = this.subscribeToCell(row, rowIndex, columnKey, control);

                this.subscriptions.set(key, subscription);
            });
        });

        this.unsubscribeInvisibleCells(expectedKeys);
    }

    private getCellKey(row: FormGroup, columnDef: string): string {
        return `${row.get('_id')?.value}:${columnDef}`;
    }

    private subscribeToCell(row: FormGroup, rowIndex: number, columnDef: string, control: AbstractControl): Subscription {
        let previousValue = control.value;

        return control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((currentValue) => {
            this.eventsService.emit('cellValueChange', {
                row,
                rowIndex,
                columnDef,
                control,
                previousValue,
                currentValue,
                value: row.value,
                rawValue: row.getRawValue(),
            });

            previousValue = currentValue;
        });
    }

    private unsubscribeInvisibleCells(expectedKeys: Set<string>): void {
        for (const [key, subscription] of this.subscriptions.entries()) {
            if (!expectedKeys.has(key)) {
                subscription.unsubscribe();
                this.subscriptions.delete(key);
            }
        }
    }
}
