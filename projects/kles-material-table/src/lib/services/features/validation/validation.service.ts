import { DestroyRef, inject, Injectable } from '@angular/core';
import { filter, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventsService } from '../events/events.service';
import { AbstractControl, FormGroup } from '@angular/forms';

@Injectable()
export class ValidationService {
    private readonly destroyRef = inject(DestroyRef);
    private readonly columnSubscriptions = new Map<string, Subscription>();
    private readonly rowSubscriptions = new Map<string, Subscription>();

    constructor(private readonly eventsService: EventsService) {}

    public listen(visibleRows: FormGroup[], visibleColumns: string[]): void {
        const expectedColumnKeys = new Set<string>();
        const expectedRowKeys = new Set<string>();
        visibleRows.forEach((row, rowIndex) => {
            const rowSubscription = this.subscribeToRow(row, rowIndex);
            const key = this.getRowKey(row);
            expectedRowKeys.add(key);
            this.rowSubscriptions.set(key, rowSubscription);

            visibleColumns.forEach((column) => {
                const columnKey = column;
                const control = row.get(columnKey);

                if (!control) {
                    return;
                }

                const key = this.getCellKey(row, columnKey);
                expectedColumnKeys.add(key);

                if (this.columnSubscriptions.has(key)) {
                    return;
                }

                const subscription = this.subscribeToCell(row, rowIndex, columnKey, control);

                this.columnSubscriptions.set(key, subscription);
            });
        });

        this.unsubscribe(expectedRowKeys, expectedColumnKeys);
    }

    private getCellKey(row: FormGroup, columnDef: string): string {
        return `${this.getRowKey(row)}:${columnDef}`;
    }

    private getRowKey(row: FormGroup): string {
        return `${row.get('_id')?.value}`;
    }

    private subscribeToCell(row: FormGroup, rowIndex: number, columnDef: string, control: AbstractControl): Subscription {
        return control.statusChanges
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((status) => status === 'INVALID'),
            )
            .subscribe(() => {
                this.eventsService.emit('cellValidationError', {
                    row,
                    rowIndex,
                    rawValue: row.getRawValue(),
                    value: row.value,
                    errors: control.errors,
                    controlsErrors: { columnDef: control.errors },
                });
            });
    }

    private subscribeToRow(row: FormGroup, rowIndex: number): Subscription {
        return row.statusChanges
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter((status) => status === 'INVALID'),
            )
            .subscribe(() => {
                this.eventsService.emit('rowValidationError', {
                    row,
                    rowIndex,
                    rawValue: row.getRawValue(),
                    value: row.value,
                    errors: row.errors,
                    controlsErrors: Object.keys(row.controls)
                        .filter((key) => row.get(key)?.errors)
                        .map((key) => ({ [key]: row.get(key)?.errors }))
                        .reduce((a, b) => ({ ...a, ...b })),
                });
            });
    }

    private unsubscribe(expectedRowKeys: Set<string>, expectedColumnKeys: Set<string>): void {
        for (const [key, subscription] of this.columnSubscriptions.entries()) {
            if (!expectedColumnKeys.has(key)) {
                subscription.unsubscribe();
                this.columnSubscriptions.delete(key);
            }
        }

        for (const [key, subscription] of this.rowSubscriptions.entries()) {
            if (!expectedRowKeys.has(key)) {
                subscription.unsubscribe();
                this.rowSubscriptions.delete(key);
            }
        }
    }
}
