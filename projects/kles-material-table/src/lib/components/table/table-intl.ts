import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class KlesTableIntl {
    readonly changes = new Subject<void>();

    emptyStateTitle = 'No data';
    emptyStateDescription = 'There are no rows to display.';
}
