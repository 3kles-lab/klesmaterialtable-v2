import { Signal } from '@angular/core';

export type CursorMode = 'auto' | 'pointer' | 'default';

export interface CursorApi {
    readonly mode: Signal<CursorMode>;
    /** Shows the pointer on data rows, independently of selection. */
    enable(): void;
    /** Removes the pointer supplied by the table. */
    disable(): void;
    /** Restores the cursor based on row click selection eligibility. */
    reset(): void;
}
