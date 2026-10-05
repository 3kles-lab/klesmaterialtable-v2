import { DestroyRef, inject, Injectable } from '@angular/core';
import { filter, startWith, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventsService } from '../events/events.service';
import { AbstractControl, FormGroup } from '@angular/forms';

interface ValidationSubscription {
    row: FormGroup;
    rowIndex: number;
    subscription?: Subscription;
}

@Injectable()
export class ValidationService {
    private readonly destroyRef = inject(DestroyRef);
    private readonly columnSubscriptions = new Map<AbstractControl, ValidationSubscription>();
    private readonly rowSubscriptions = new Map<FormGroup, ValidationSubscription>();

    constructor(private readonly eventsService: EventsService) {}

    public listen(visibleRows: FormGroup[], visibleColumns: string[]): void {
        const expectedControls = new Set<AbstractControl>();
        const expectedRows = new Set(visibleRows);
        visibleRows.forEach((row, rowIndex) => {
            let rowEntry = this.rowSubscriptions.get(row);
            if (rowEntry) {
                rowEntry.rowIndex = rowIndex;
            } else {
                rowEntry = { row, rowIndex };
                this.rowSubscriptions.set(row, rowEntry);
                rowEntry.subscription = this.subscribeToRow(rowEntry);
            }
            visibleColumns.forEach((columnDef) => {
                const control = row.get(columnDef);
                if (!control) return;
                expectedControls.add(control);
                const existing = this.columnSubscriptions.get(control);
                if (existing) {
                    existing.rowIndex = rowIndex;
                    return;
                }
                const entry: ValidationSubscription = { row, rowIndex };
                this.columnSubscriptions.set(control, entry);
                entry.subscription = control.statusChanges.pipe(
                    takeUntilDestroyed(this.destroyRef),
                    filter((status) => status === 'INVALID'),
                ).subscribe(() => {
                    this.eventsService.emit('cellValidationError', {
                        row,
                        rowIndex: entry.rowIndex,
                        rawValue: row.getRawValue(),
                        value: row.value,
                        errors: control.errors,
                        controlsErrors: { [columnDef]: control.errors },
                    });
                });
            });
        });
        for (const [control, entry] of this.columnSubscriptions) {
            if (!expectedControls.has(control)) {
                entry.subscription?.unsubscribe();
                this.columnSubscriptions.delete(control);
            }
        }
        for (const [row, entry] of this.rowSubscriptions) {
            if (!expectedRows.has(row)) {
                entry.subscription?.unsubscribe();
                this.rowSubscriptions.delete(row);
            }
        }
    }

    private subscribeToRow(entry: ValidationSubscription): Subscription {
        const row = entry.row;
        return row.statusChanges.pipe(
            startWith(row.status),
            takeUntilDestroyed(this.destroyRef),
            filter((status) => status === 'INVALID'),
        ).subscribe(() => {
            this.eventsService.emit('rowValidationError', {
                row,
                rowIndex: entry.rowIndex,
                rawValue: row.getRawValue(),
                value: row.value,
                errors: row.errors,
                controlsErrors: Object.fromEntries(
                    Object.entries(row.controls)
                        .filter(([, control]) => control.errors)
                        .map(([name, control]) => [name, control.errors]),
                ),
            });
        });
    }
}
